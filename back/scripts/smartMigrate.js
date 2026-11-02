const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { createClient } = require('@supabase/supabase-js');

// Supabase 설정 (Service Role Key 사용하여 RLS 우회)
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY);

const RAW_DATA_PATH = path.join(__dirname, '../../temp_buildcores_db/open-db');
const CATEGORIES = ['CPU', 'GPU', 'Motherboard', 'RAM', 'Storage', 'PSU', 'CPUCooler', 'PCCase'];

/**
 * 스마트 필터링 로직: 10년 전 고물이나 서버용 부품은 거름
 */
function isModernPart(category, part) {
    const name = (part.metadata?.name || part.name || '').toUpperCase();
    if (!name) return false;

    // 공통 제외 (서버, 쿼드로, 워크스테이션)
    if (name.includes('XEON') || name.includes('EPYC') || name.includes('THREADRIPPER') || name.includes('OPTERON')) return false;
    if (name.includes('QUADRO') || name.includes('TESLA') || name.includes('FIREPRO') || name.includes('INSTINCT')) return false;

    switch (category) {
        case 'CPU':
            // 인텔: 12, 13, 14세대 및 Core Ultra 이상 (정규식 완화)
            if (name.includes('INTEL')) {
                if (name.match(/I\d-1[234]\d{3}/) || name.includes('ULTRA') || name.includes('12TH') || name.includes('13TH') || name.includes('14TH')) return true;
                // 세대 숫자가 직접 안 적힌 경우 소켓 확인
                if (part.socket === 'LGA 1700' || part.socket === 'LGA1700') return true;
                return false;
            }
            // AMD: 라이젠 5000, 7000, 8000, 9000 시리즈
            if (name.includes('RYZEN')) {
                if (name.match(/[5789]\d{3}/) || name.includes('X3D')) return true;
                if (part.socket === 'AM5') return true;
                return false;
            }
            return false;

        case 'GPU':
            // NVIDIA: RTX 30, 40, 50 시리즈 및 GTX 16 시리즈
            if (name.includes('RTX 30') || name.includes('RTX 40') || name.includes('RTX 50')) return true;
            if (name.includes('GTX 16')) return true;
            // AMD: RX 6000, 7000 시리즈 이상
            if (name.includes('RX 6') || name.includes('RX 7')) return true;
            return false;

        case 'Motherboard':
            const socket = (part.socket || '').toUpperCase();
            // 현역 소켓만 허용
            if (socket.includes('LGA1700') || socket.includes('AM4') || socket.includes('AM5')) return true;
            return false;

        case 'RAM':
            const type = (part.memory_type || part.ram_type || (part.memory && part.memory.ram_type) || '').toUpperCase();
            // DDR4, DDR5만 허용
            return type.includes('DDR4') || type.includes('DDR5');

        case 'Storage':
            // SSD (NVMe/SATA) 500GB 이상만
            if (!name.includes('SSD') && !name.includes('NVME')) return false;
            const cap = part.capacity || (part.metadata && part.metadata.variant && parseInt(part.metadata.variant)) || 0;
            if (cap < 480 && !name.includes('500GB') && !name.includes('1TB')) return false;
            return true;

        case 'PSU':
            // 500W 이상 정격 파워만
            const wattage = part.wattage || part.total_wattage || (part.metadata && part.metadata.variant && parseInt(part.metadata.variant)) || parseInt(name.match(/(\d+)W/)?.[1]) || 0;
            return wattage >= 500;

        case 'CPUCooler':
        case 'PCCase':
            // 최근 5년 이내 출시된 제품 위주 (releaseYear 확인)
            const year = part.metadata?.releaseYear || 2020;
            if (year < 2018) return false;
            if (name.includes('ANCIENT') || name.includes('LEGACY')) return false;
            return true;

        default:
            return false;
    }
}

async function startMigration() {
    console.log('🚀 스마트 필터링 마이그레이션 시작...');
    let totalUploaded = 0;

    for (const cat of CATEGORIES) {
        const dirPath = path.join(RAW_DATA_PATH, cat);
        if (!fs.existsSync(dirPath)) {
            console.warn(`⚠️ 폴더 없음: ${cat}`);
            continue;
        }

        const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.json'));
        console.log(`\n📂 [${cat}] 분석 중... (총 ${files.length}개 파일)`);

        let catProcessed = 0;
        let catUploaded = 0;
        const batch = [];

        for (const file of files) {
            try {
                const raw = fs.readFileSync(path.join(dirPath, file), 'utf8');
                const part = JSON.parse(raw);
                catProcessed++;

                // 스마트 필터 적용
                if (isModernPart(cat, part)) {
                    batch.push({
                        id: part.opendb_id || part.id,
                        name: part.metadata?.name || part.name,
                        category: cat,
                        specs: part, // 전체 데이터를 specs에 저장
                        manufacturer: part.metadata?.manufacturer || part.manufacturer || 'Unknown'
                    });
                }

                // 100개 단위로 배치 업로드
                if (batch.length >= 100) {
                    const { error } = await supabase.from('parts').upsert(batch, { onConflict: 'id' });
                    if (error) {
                        console.error(`❌ 업로드 에러 (${cat}):`, error.message);
                    } else {
                        catUploaded += batch.length;
                    }
                    batch.length = 0;
                }
            } catch (e) {
                // 파싱 에러 등은 조용히 넘김
            }
        }

        if (batch.length > 0) {
            const { error } = await supabase.from('parts').upsert(batch, { onConflict: 'id' });
            if (!error) catUploaded += batch.length;
        }
        
        totalUploaded += catUploaded;
        console.log(`✅ [${cat}] 완료! (필터링 통과: ${catUploaded} / 전체 스캔: ${catProcessed})`);
    }

    console.log('\n-------------------------------------------');
    console.log(`🏁 마이그레이션 최종 종료!`);
    console.log(`✨ 총 업로드된 정예 부품 수: ${totalUploaded}개`);
    console.log('-------------------------------------------');
}

startMigration();