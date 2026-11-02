const supabase = require('../config/supabase');
const coreLibrary = require('../data/corePartsLibrary.json');

// 헬퍼: 소켓/타입 추론 (기존 엔진 로직 재사용)
function inferSocketFromName(name) {
  if (!name) return null;
  const upper = name.toUpperCase();
  if (upper.includes('AM5') || upper.includes('B650') || upper.includes('X670') || upper.includes('A620')) return 'AM5';
  if (upper.includes('AM4') || upper.includes('B550') || upper.includes('X570') || upper.includes('A520')) return 'AM4';
  if (upper.includes('LGA1700') || upper.includes('Z790') || upper.includes('B760') || upper.includes('Z690') || upper.includes('B660') || upper.includes('H610')) return 'LGA 1700';
  if (upper.includes('LGA1200') || upper.includes('Z590') || upper.includes('B560') || upper.includes('H510')) return 'LGA 1200';
  
  // CPU 이름으로 소켓 유추
  if (upper.match(/I[3579]-1[234]\d\d\d/) || upper.match(/I[3579]\s1[234]\d\d\d/)) return 'LGA 1700';
  if (upper.match(/I[3579]-1[01]\d\d\d/) || upper.match(/I[3579]\s1[01]\d\d\d/)) return 'LGA 1200';
  if (upper.match(/RYZEN\s?[3579]\s?[789]\d\d\d/)) return 'AM5';
  if (upper.match(/RYZEN\s?[3579]\s?[345]\d\d\d/)) return 'AM4';
  
  return null;
}

function checkHasIGPU(part) {
    if (part.specs?.has_igpu !== undefined) return part.specs.has_igpu;
    
    const nameUpper = part.name.toUpperCase();
    if (nameUpper.includes('INTEL') || nameUpper.includes('CORE')) {
        if (nameUpper.match(/\d+K?F[\s$]/) || nameUpper.match(/\d+X[\s$]/) || nameUpper.match(/\d+XE[\s$]/)) return false;
        return true;
    }
    if (nameUpper.includes('AMD') || nameUpper.includes('RYZEN')) {
        if (nameUpper.match(/G$/) || nameUpper.match(/\sG\s/)) return true;
        if (nameUpper.match(/RYZEN\s?[3579]\s?[789]\d\d\d/) && !nameUpper.match(/F$/)) return true; // Ryzen 7000/8000/9000
        return false;
    }
    return false;
}

function inferGpuCategory(name) {
    const nameUpper = name.toUpperCase();
    // Workstation
    if (nameUpper.includes('A2000') || nameUpper.includes('A4000') || nameUpper.includes('A5000') || 
        nameUpper.includes('6000 ADA') || nameUpper.includes('QUADRO') || nameUpper.includes('RADEON PRO')) {
        return 'Workstation';
    }
    // AI
    if (nameUpper.includes('H100') || nameUpper.includes('H200') || nameUpper.includes('A100') || 
        nameUpper.includes('A40') || nameUpper.includes('L40') || nameUpper.includes('MI300') || 
        nameUpper.includes('AI PRO')) {
        return 'AI';
    }
    // Mining
    if (nameUpper.includes('CMP') || nameUpper.includes('MINING')) {
        return 'Mining';
    }
    // Gaming (Default)
    return 'Gaming';
}

function inferRamTypeFromName(name) {
  if (!name) return null;
  const upper = name.toUpperCase();
  if (upper.includes('DDR5')) return 'DDR5';
  if (upper.includes('DDR4')) return 'DDR4';
  return null;
}

// 헬퍼: 더미 데이터 생성기 (DB에 가격이 없을 때를 대비한 임시 가격 및 성능 점수)
function enrichPartData(part) {
    const enriched = { ...part };
    if (!enriched.specs) enriched.specs = {};
    
    // 코어 라이브러리와 매칭 시도
    const categoryLower = part.category.toLowerCase().replace('pc', '').replace('cpu', '');
    const coreList = coreLibrary[categoryLower] || [];
    const matchedCore = coreList.find(c => part.name.toUpperCase().includes(c.search_keyword.toUpperCase()));

    // 기본 가상 가격 (카테고리별 대략적인 중앙값)
    const basePrices = { CPU: 250000, GPU: 400000, Motherboard: 150000, RAM: 80000, Storage: 100000, PSU: 80000, PCCase: 50000, CPUCooler: 40000 };
    
    // 성능 점수 휴리스틱
    if (part.category === 'CPU') {
        enriched.specs.performance_score = matchedCore?.performance_score || (part.specs.cores?.total ? part.specs.cores.total * 10 : 50);
        enriched.specs.Socket = matchedCore?.socket || part.specs.socket || inferSocketFromName(part.name);
        enriched.specs.has_igpu = checkHasIGPU(part);
    } else if (part.category === 'GPU') {
        enriched.specs.performance_score = matchedCore?.performance_score || (part.specs.memory ? part.specs.memory * 10 : 50);
        enriched.gpu_category = inferGpuCategory(part.name);
    } else if (part.category === 'Motherboard') {
        enriched.specs.Socket = part.specs.Socket || part.specs.socket || inferSocketFromName(part.name);
        enriched.specs.memory_type = part.specs.memory_type || inferRamTypeFromName(part.name);
    }

    // 가상 가격 세팅
    const nameUpper = part.name.toUpperCase();
    
    if (part.category === 'GPU') {
        if (nameUpper.includes('5090')) { enriched.specs.estimatedPrice = 4000000; enriched.specs.performance_score = 400; }
        else if (nameUpper.includes('5080')) { enriched.specs.estimatedPrice = 1800000; enriched.specs.performance_score = 300; }
        else if (nameUpper.includes('5070 TI') || nameUpper.includes('5070TI')) { enriched.specs.estimatedPrice = 1300000; enriched.specs.performance_score = 250; }
        else if (nameUpper.includes('5070')) { enriched.specs.estimatedPrice = 1000000; enriched.specs.performance_score = 220; }
        else if (nameUpper.includes('4090')) { enriched.specs.estimatedPrice = 2800000; enriched.specs.performance_score = 280; }
        else if (nameUpper.includes('4080')) { enriched.specs.estimatedPrice = 1500000; enriched.specs.performance_score = 200; }
        else if (nameUpper.includes('4070 TI') || nameUpper.includes('4070TI')) { enriched.specs.estimatedPrice = 1100000; enriched.specs.performance_score = 170; }
        else if (nameUpper.includes('4070')) { enriched.specs.estimatedPrice = 800000; enriched.specs.performance_score = 150; }
        else if (nameUpper.includes('4060 TI') || nameUpper.includes('4060TI')) { enriched.specs.estimatedPrice = 550000; enriched.specs.performance_score = 120; }
        else if (nameUpper.includes('4060')) { enriched.specs.estimatedPrice = 400000; enriched.specs.performance_score = 100; }
        else if (nameUpper.includes('3060')) { enriched.specs.estimatedPrice = 300000; enriched.specs.performance_score = 80; }
        else if (nameUpper.includes('7900 XTX')) { enriched.specs.estimatedPrice = 1400000; enriched.specs.performance_score = 210; }
        else if (nameUpper.includes('7800 XT')) { enriched.specs.estimatedPrice = 750000; enriched.specs.performance_score = 160; }
        else if (nameUpper.includes('7600')) { enriched.specs.estimatedPrice = 350000; enriched.specs.performance_score = 90; }
        else if (matchedCore?.price) { enriched.specs.estimatedPrice = matchedCore.price; }
        else { enriched.specs.estimatedPrice = (enriched.specs.performance_score || 50) * 8000; }
    } else if (part.category === 'CPU') {
        if (nameUpper.includes('9800X3D')) { enriched.specs.estimatedPrice = 700000; enriched.specs.performance_score = 300; }
        else if (nameUpper.includes('9950X')) { enriched.specs.estimatedPrice = 1000000; enriched.specs.performance_score = 350; }
        else if (nameUpper.includes('14900K')) { enriched.specs.estimatedPrice = 900000; enriched.specs.performance_score = 330; }
        else if (nameUpper.includes('9700X')) { enriched.specs.estimatedPrice = 550000; enriched.specs.performance_score = 250; }
        else if (nameUpper.includes('14700K')) { enriched.specs.estimatedPrice = 600000; enriched.specs.performance_score = 260; }
        else if (nameUpper.includes('9600X')) { enriched.specs.estimatedPrice = 350000; enriched.specs.performance_score = 180; }
        else if (nameUpper.includes('14400F')) { enriched.specs.estimatedPrice = 280000; enriched.specs.performance_score = 150; }
        else if (matchedCore?.price) { enriched.specs.estimatedPrice = matchedCore.price; }
        else { enriched.specs.estimatedPrice = (enriched.specs.performance_score || 50) * 4000; }
    } else {
        enriched.specs.estimatedPrice = matchedCore?.price || basePrices[part.category] || 100000;
    }
    
    if (part.specs?.Price > 0) {
        enriched.specs.estimatedPrice = part.specs.Price;
    }
    
    return enriched;
}

// 헬퍼: 부품 분류 및 기본 필터링 (서버용 제외)
function categorizeAndFilterParts(allParts) {
    const map = { CPU: [], GPU: [], Motherboard: [], RAM: [], Storage: [], PSU: [], Case: [], Cooler: [] };
    
    allParts.forEach(part => {
        let cat = part.category;
        // DB 카테고리명을 정규화
        if (cat === 'PCCase' || cat === 'Case') cat = 'Case';
        if (cat === 'CPUCooler' || cat === 'Cooler' || cat === 'CPU Cooler') cat = 'Cooler';
        if (cat === 'Motherboard' || cat === 'MB' || cat === 'Mainboard') cat = 'Motherboard';
        if (cat === 'Memory' || cat === 'RAM') cat = 'RAM';
        
        if (!map[cat]) return;
        const name = part.name.toUpperCase();
        // 서버/워크스테이션 필터링
        // 서버/워크스테이션 및 구형 필터링
        if (name.includes('THREADRIPPER') || name.includes('XEON') || name.includes('EPYC')) return;
        
        // 데이터 인리치먼트 (가상 가격/성능 점수 추가)
        const enrichedPart = enrichPartData(part);
        
        const nameUpper = enrichedPart.name.toUpperCase();
        
        // 1. 단종/구형 폼팩터 및 서버 라인업 절대 제외
        if (
            nameUpper.includes('LGA1151') || nameUpper.includes('LGA2011') || nameUpper.includes('LGA2066') || 
            nameUpper.includes('LGA1200') || nameUpper.includes('TR4') || nameUpper.includes('STRX4') ||
            nameUpper.includes('DDR3') || nameUpper.includes('EXTREME') || nameUpper.includes('XEON') || 
            nameUpper.includes('EPYC') || nameUpper.includes('THREADRIPPER') || nameUpper.includes('PENTIUM') || 
            nameUpper.includes('CELERON') || nameUpper.includes('ATHLON')
        ) {
            return; // 완전히 필터링
        }

        // 2. 구형 CPU 절대 배제 (Whitelist 방식 적용)
        if (cat === 'CPU') {
            if (nameUpper.includes('INTEL') || nameUpper.includes('CORE')) {
                // 인텔은 10세대 이상만 허용 (DB 한계상 10/11세대 포함)
                const isModernIntel = nameUpper.match(/I[3579]-[1][012345]\d\d\d/) || nameUpper.match(/I[3579]\s[1][012345]\d\d\d/) || nameUpper.match(/CORE\s(ULTRA)/);
                if (!isModernIntel) return;
            } else if (nameUpper.includes('AMD') || nameUpper.includes('RYZEN')) {
                // AMD는 라이젠 3000번대 이상 허용 (FX, 애슬론 등 절대 차단)
                const isModernAMD = nameUpper.match(/RYZEN\s?[3579]\s?[345789]\d\d\d/);
                if (!isModernAMD) return;
            } else {
                return; // 인텔도 AMD도 알 수 없는 이상한 브랜드면 제외
            }
        }

        // 3. 구형 GPU 세대 필터링 (RTX 3000 시리즈, RX 6000 시리즈 이상만 허용)
        if (cat === 'GPU') {
            if (nameUpper.includes('GTX') || nameUpper.includes('GT ') || nameUpper.includes('RTX 20') || nameUpper.includes('TITAN')) return;
            if (nameUpper.match(/RX\s?[45]\d0/) || nameUpper.includes('RADEON VII') || nameUpper.match(/RX\s?5\d\d\d/)) return;
            if (nameUpper.includes('ARC A')) return; // 일단 아크도 안정성을 위해 제외
        }

        // 4. RAM 최소 용량 강제 (16GB 미만 절대 배제)
        if (cat === 'RAM') {
            const capacity = enrichedPart.specs?.capacity || enrichedPart.specs?.modules?.capacity_gb * (enrichedPart.specs?.modules?.quantity || 1) || parseInt(nameUpper.match(/(\d+)GB/)?.[1]) || 0;
            if (capacity < 16) return; // 16GB 미만은 조립에서 배제 (2026년 기준)
        }

        // 5. SSD 최소 용량 강제 (500GB 미만 배제)
        if (cat === 'Storage') {
            // HDD 배제
            if (nameUpper.includes('HDD') || (enrichedPart.specs?.type && enrichedPart.specs.type.toUpperCase() === 'HDD')) return;
            const capacityStr = nameUpper.match(/(\d+)(TB|GB)/);
            let capacityGB = 0;
            if (capacityStr) {
                if (capacityStr[2] === 'TB') capacityGB = parseInt(capacityStr[1]) * 1000;
                else capacityGB = parseInt(capacityStr[1]);
            } else {
                capacityGB = enrichedPart.specs?.capacity || 0;
            }
            if (capacityGB < 500) return; // 500GB 미만 SSD 배제
        }

        map[cat].push(enrichedPart);
    });
    return map;
}

// 헬퍼: 긴급용 더미 부품 반환기
function getEmergencyDummyPart(category, socket, minWattage) {
    const isDdr5 = socket === 'AM5' || socket === 'LGA 1700';
    const dummys = {
        Motherboard: { id: 'dummy_mb', name: `기본형 메인보드 (${socket || '표준'})`, category: 'Motherboard', specs: { Socket: socket || 'AM5', memory_type: isDdr5 ? 'DDR5' : 'DDR4', estimatedPrice: 150000, Price: 150000 } },
        Case: { id: 'dummy_case', name: '표준 미들타워 케이스', category: 'Case', specs: { estimatedPrice: 50000, Price: 50000 } },
        Cooler: { id: 'dummy_cooler', name: '기본 공랭 쿨러', category: 'Cooler', specs: { estimatedPrice: 30000, Price: 30000 } },
        PSU: { id: 'dummy_psu', name: `정격 ${minWattage || 600}W 이상 파워`, category: 'PSU', specs: { estimatedPrice: 80000, Price: 80000, total_wattage: minWattage || 600 } }
    };
    return dummys[category] || null;
}

// 헬퍼: 용도별 예산 비중
function getBudgetRatio(usage) {
    if (usage === 'gaming') return { cpu: 0.20, gpu: 0.45, motherboard: 0.10, ram: 0.08, storage: 0.05, psu: 0.07, case: 0.03, cooler: 0.02 };
    if (usage === 'work') return { cpu: 0.35, gpu: 0.25, motherboard: 0.15, ram: 0.10, storage: 0.08, psu: 0.05, case: 0.02, cooler: 0.00 };
    if (usage === 'stream') return { cpu: 0.25, gpu: 0.35, motherboard: 0.12, ram: 0.08, storage: 0.08, psu: 0.07, case: 0.03, cooler: 0.02 };
    if (usage === 'office') return { cpu: 0.45, gpu: 0.00, motherboard: 0.20, ram: 0.10, storage: 0.10, psu: 0.10, case: 0.05, cooler: 0.00 }; // 내장그래픽 위주
    return { cpu: 0.25, gpu: 0.35, motherboard: 0.12, ram: 0.08, storage: 0.08, psu: 0.07, case: 0.03, cooler: 0.02 }; // 기본 밸런스
}
/**
 * 용도와 예산, 브랜드에 맞게 100% 호환되는 부품 1세트를 알고리즘으로 조립합니다. (V3.0 V-Combo Engine)
 */
let cachedAllParts = null;
let lastCacheTime = 0;

async function generateDeterministicBuild(totalBudget, usage, brand = '상관없음') {
  // 1. 전체 부품 데이터 가져오기 (메모리 캐싱 도입)
  if (!cachedAllParts || Date.now() - lastCacheTime > 60000) {
      const { data, error } = await supabase.from('parts').select('id, name, category, specs, manufacturer');
      if (error || !data) throw new Error('부품 데이터를 불러오지 못했습니다.');
      cachedAllParts = data;
      lastCacheTime = Date.now();
  }
  const allParts = cachedAllParts;

  // 카테고리별 분류 및 기본 필터링 (서버용 부품 제외, 가상 데이터 인리치먼트)
  const partsMap = categorizeAndFilterParts(allParts);

  const build = {};
  
  // 2. CPU / GPU 후보 필터링 (브랜드, 내장그래픽 여부 등)
  let cpuCandidates = partsMap.CPU;
  if (brand === '인텔 (Intel)') {
      cpuCandidates = partsMap.CPU.filter(p => p.name.toUpperCase().includes('INTEL') || p.name.toUpperCase().includes('CORE'));
  } else if (brand === 'AMD') {
      cpuCandidates = partsMap.CPU.filter(p => p.name.toUpperCase().includes('AMD') || p.name.toUpperCase().includes('RYZEN'));
  }

  // 사무용일 경우 강제로 내장그래픽을 가진 CPU만 허용
  if (usage === 'office') {
      cpuCandidates = cpuCandidates.filter(p => p.specs.has_igpu === true);
      // AMD G시리즈 우대 (과거 유산 유지)
      cpuCandidates.forEach(p => {
          if (p.name.toUpperCase().includes('AMD') && p.name.toUpperCase().includes('G')) {
              p.specs.performance_score = (p.specs.performance_score || 50) + 20;
          }
      });
  }

  let gpuCandidates = partsMap.GPU;
  
  if (usage === 'gaming') {
      // 게이밍 용도에서는 순수 Gaming GPU만 허용
      gpuCandidates = gpuCandidates.filter(p => p.gpu_category === 'Gaming');
  }

  if (usage === 'office' || totalBudget < 400000) {
      gpuCandidates = [{ id: 'dummy_gpu', name: '내장그래픽 (Integrated Graphics)', category: 'GPU', specs: { estimatedPrice: 0, Price: 0, performance_score: 10 } }];
  }

  // 3. V-Combo 알고리즘 V3.1 (비율 점수제 및 병목 제어)
  let maxGamingScore = 1;
  const validCombos = [];
  
  for (const cpu of cpuCandidates) {
      for (const gpu of gpuCandidates) {
          const cpuPrice = cpu.specs?.estimatedPrice || cpu.specs?.Price || 0;
          const gpuPrice = gpu.specs?.estimatedPrice || gpu.specs?.Price || 0;
          const comboPrice = cpuPrice + gpuPrice;
          
          // 예산 활용도 계산
          const estimatedTotal = usage === 'office' ? comboPrice / 0.45 : comboPrice / 0.65;
          const budgetUsage = (estimatedTotal / totalBudget) * 100;
          
          // 1단계: 강성 예산 필터 (110% 초과 조합 무조건 평가 제외)
          if (budgetUsage > 110) continue;
          
          // 고예산(200만 이상) 사무용 내장그래픽 차단 (예산 낭비 견적 방지)
          if (usage === 'office' && gpu.id === 'dummy_gpu' && totalBudget >= 2000000) continue;
          
          const cpuPerf = cpu.specs?.performance_score || 50;
          const gpuPerf = gpu.specs?.performance_score || 50;
          let gamingScore = 0;
          if (usage === 'gaming') gamingScore = (cpuPerf * 0.3) + (gpuPerf * 0.7);
          else if (usage === 'work') gamingScore = (cpuPerf * 0.6) + (gpuPerf * 0.4);
          else if (usage === 'stream') gamingScore = (cpuPerf * 0.4) + (gpuPerf * 0.6);
          else gamingScore = cpuPerf;
          
          if (gamingScore > maxGamingScore) maxGamingScore = gamingScore;
          
          validCombos.push({ cpu, gpu, comboPrice, estimatedTotal, gamingScore, cpuPerf, gpuPerf, budgetUsage });
      }
  }

  let bestCombo = null;
  let bestScore = -999999;
  
  for (const combo of validCombos) {
      // (1) Gaming Score Weight (70%) - 동적 정규화
      const normalizedGaming = (combo.gamingScore / maxGamingScore) * 100;
      const gamingScoreWeight = normalizedGaming * 0.7;
      
      // (2) Budget Fit Score Weight (20%) - 부드러운 곡선
      let budgetFit = 0;
      if (combo.budgetUsage >= 95 && combo.budgetUsage <= 105) budgetFit = 100;
      else budgetFit = 100 - Math.abs(100 - combo.budgetUsage);
      const budgetScoreWeight = Math.max(0, budgetFit) * 0.2;
      
      // (3) Platform Score Weight (10%)
      const cpuSocket = combo.cpu.specs?.Socket || inferSocketFromName(combo.cpu.name) || '';
      const cpuNameUpper = combo.cpu.name.toUpperCase();
      let platformRaw = 80; // AM4 등 현역 레거시 기본점수
      
      if (cpuSocket.includes('AM5') || cpuSocket.includes('LGA 1700') || cpuSocket.includes('LGA1700')) platformRaw = 100;
      if (cpuSocket.includes('LGA 1200') || cpuSocket.includes('LGA 1151') || cpuSocket.includes('2066')) platformRaw = 50;
      
      if (cpuNameUpper.match(/I[3579][-\s]?[1][01]\d\d\d/)) platformRaw -= 20;
      if (cpuNameUpper.match(/RYZEN\s?[3579]\s?[34]\d\d\d/)) platformRaw -= 20;
      
      const platformScoreWeight = Math.max(0, platformRaw) * 0.1;
      
      // (4) Bottleneck Penalty (CPU 티어 < GPU 티어 - 1 일 때 -15점)
      let bottleneckPenalty = 0;
      let cpuTier = combo.cpuPerf >= 250 ? 5 : (combo.cpuPerf >= 150 ? 4 : (combo.cpuPerf >= 100 ? 3 : (combo.cpuPerf >= 50 ? 2 : 1)));
      let gpuTier = combo.gpuPerf >= 250 ? 5 : (combo.gpuPerf >= 150 ? 4 : (combo.gpuPerf >= 100 ? 3 : (combo.gpuPerf >= 50 ? 2 : 1)));
      
      if (cpuTier < gpuTier - 1) bottleneckPenalty = 15;

      // (5) 호환성 패널티 (Compatibility Penalty)
      // CPU에 맞는 메인보드가 DB에 존재하는지 확인
      let compatibilityPenalty = 0;
      const hasCompatibleMb = partsMap.Motherboard.some(mb => {
          const mbSocket = mb.specs?.Socket || inferSocketFromName(mb.name);
          return mbSocket === cpuSocket || !mbSocket;
      });
      if (!hasCompatibleMb) compatibilityPenalty = 20;
      
      // 최종 점수 합산 (만점 100점)
      const finalScore = gamingScoreWeight + budgetScoreWeight + platformScoreWeight - bottleneckPenalty - compatibilityPenalty;
      
      if (finalScore > bestScore) {
          bestScore = finalScore;
          
          let grade = 'C';
          if (finalScore >= 85) grade = 'S';
          else if (finalScore >= 75) grade = 'A';
          else if (finalScore >= 60) grade = 'B';
          
          if (bottleneckPenalty > 0 && grade === 'S') grade = 'A';
          
          const reasoning = [];
          reasoning.push(`예산 활용률 ${combo.budgetUsage.toFixed(0)}%`);
          if (normalizedGaming >= 95) reasoning.push(`동급 예산 게이밍 성능 상위 5%`);
          else if (normalizedGaming >= 80) reasoning.push(`우수한 게이밍 밸런스`);
          
          if (bottleneckPenalty === 0) {
              const gpuShort = combo.gpu.name.match(/(RTX\s\d{4}(?:\sTI|SUPER)?|RX\s\d{4}(?:\sXT)?|GTX\s\d{4}(?:\sTI|SUPER)?)/i);
              reasoning.push(`${gpuShort ? gpuShort[0] : '해당 GPU'}와(과) 병목 없음`);
          } else {
              reasoning.push(`일부 병목 존재`);
          }
          
          if (platformRaw >= 100) reasoning.push(`${cpuSocket || '최신'} 플랫폼 (업그레이드 용이)`);
          if (compatibilityPenalty > 0) reasoning.push(`메인보드 호환성 주의`);
          
          bestCombo = { 
              ...combo, grade, reasoning, finalScore,
              gamingScoreWeight, budgetScoreWeight, platformScoreWeight, bottleneckPenalty, compatibilityPenalty
          };
      }
  }

  // 예외 처리 (조합 실패 시)
  if (!bestCombo) {
      console.warn('[V3.1 Engine] 조건에 맞는 콤보가 없습니다. 예산 110% 컷 통과 실패.');
      // 폴백으로 강제 생성 (예산 무시)
      bestCombo = { 
        cpu: cpuCandidates[0], gpu: gpuCandidates[0], comboPrice: 0, 
        grade: 'C', reasoning: ['예산 범위 밖 대체 조합'], finalScore: 0,
        gamingScoreWeight: 0, budgetScoreWeight: 0, platformScoreWeight: 0, bottleneckPenalty: 0, compatibilityPenalty: 0, budgetUsage: 0
      };
  }

  // 4. 요구사항: 왜 이 부품을 골랐는지 콘솔 로그 출력
  console.log('\n================================================');
  console.log(`[V3.1 V-Combo 추천 리포트] 타겟 예산: ${totalBudget}원`);
  console.log(`선택된 CPU: ${bestCombo.cpu.name}`);
  console.log(`선택된 GPU: ${bestCombo.gpu.name}`);
  console.log(`- 게이밍 성능 점수: ${bestCombo.gamingScoreWeight.toFixed(1)} / 70`);
  console.log(`- 예산 활용 점수 (${bestCombo.budgetUsage.toFixed(1)}%): ${bestCombo.budgetScoreWeight.toFixed(1)} / 20`);
  console.log(`- 플랫폼 가산점: ${bestCombo.platformScoreWeight.toFixed(1)} / 10`);
  console.log(`- 병목 패널티: -${bestCombo.bottleneckPenalty}`);
  console.log(`- 호환성 패널티: -${bestCombo.compatibilityPenalty}`);
  console.log(`>> 최종 합산 점수: ${bestCombo.finalScore.toFixed(1)} (등급: ${bestCombo.grade})`);
  console.log(`선정 이유: ${bestCombo.reasoning.join(', ')}`);
  console.log('================================================\n');

  build.cpu = bestCombo.cpu;
  build.gpu = bestCombo.gpu;
  build.grade = bestCombo.grade;
  build.reasoning = bestCombo.reasoning;
  build.finalScore = bestCombo.finalScore;

  // 5. 종속 부품 및 나머지 부품 조립 (선택된 CPU/GPU 기반)
  const budgetRatio = getBudgetRatio(usage);
  const cpuSocket = build.cpu.specs?.Socket || inferSocketFromName(build.cpu.name);
  const remainingBudget = totalBudget - bestCombo.comboPrice;
  
  // 나머지 부품(MB, RAM, PSU, Case, Cooler, Storage) 비율 합산
  const remainRatioTotal = budgetRatio.motherboard + budgetRatio.ram + budgetRatio.storage + budgetRatio.psu + budgetRatio.case + budgetRatio.cooler;
  
  const mbBudget = remainingBudget * (budgetRatio.motherboard / remainRatioTotal);
  const compatibleMBs = partsMap.Motherboard.filter(mb => {
      const mbSocket = mb.specs?.Socket || inferSocketFromName(mb.name);
      return mbSocket === cpuSocket || !mbSocket;
  });
  build.motherboard = selectBestPart(compatibleMBs, mbBudget);
  if (!build.motherboard) throw new Error('호환 가능한 실제 메인보드를 찾지 못했습니다.');

  const ramType = build.motherboard?.specs?.memory_type || inferRamTypeFromName(build.motherboard?.name) || (cpuSocket === 'AM5' ? 'DDR5' : 'DDR4');
  const ramBudget = remainingBudget * (budgetRatio.ram / remainRatioTotal);
  const compatibleRams = partsMap.RAM.filter(ram => {
      const rType = ram.specs?.type || inferRamTypeFromName(ram.name);
      return rType === ramType || !rType;
  });
  build.ram = selectBestPart(compatibleRams, ramBudget);
  if (!build.ram) throw new Error('호환 가능한 실제 RAM을 찾지 못했습니다.');

  const cpuTdp = build.cpu.specs?.tdp || 65;
  const gpuTdp = build.gpu.specs?.tdp || 200;
  const totalTdp = cpuTdp + gpuTdp;
  const targetWattage = Math.ceil((totalTdp * 1.5) / 50) * 50;

  const psuBudget = remainingBudget * (budgetRatio.psu / remainRatioTotal);
  const compatiblePsus = partsMap.PSU.filter(psu => {
      const wattage = psu.specs?.total_wattage || parseInt(psu.name.match(/(\d+)W/)?.[1]) || psu.specs?.wattage || 0;
      return wattage >= targetWattage;
  });
  build.psu = selectBestPart(compatiblePsus, psuBudget) || selectBestPart(compatiblePsus, psuBudget, true);
  if (!build.psu) throw new Error(`정격 ${targetWattage}W 이상의 실제 파워 서플라이를 찾지 못했습니다.`);

  build.storage = selectBestPart(partsMap.Storage, remainingBudget * (budgetRatio.storage / remainRatioTotal)) || selectBestPart(partsMap.Storage, remainingBudget * (budgetRatio.storage / remainRatioTotal), true);
  if (!build.storage) throw new Error('실제 스토리지(SSD/HDD)를 찾지 못했습니다.');

  build.case = selectBestPart(partsMap.Case, remainingBudget * (budgetRatio.case / remainRatioTotal)) || selectBestPart(partsMap.Case, remainingBudget * (budgetRatio.case / remainRatioTotal), true);
  if (!build.case) throw new Error('실제 PC 케이스를 찾지 못했습니다.');

  if (budgetRatio.cooler > 0) {
      build.cooler = selectBestPart(partsMap.Cooler, remainingBudget * (budgetRatio.cooler / remainRatioTotal));
      if (!build.cooler) throw new Error('실제 쿨러를 찾지 못했습니다.');
  } else {
      build.cooler = { id: 'dummy_cooler_stock', name: '기본 공랭 쿨러 (CPU 번들)', category: 'Cooler', specs: { estimatedPrice: 0, Price: 0 } };
  }

  // 대안(Alternatives) 추가
  if (build.cpu) {
      let betterCpu = cpuCandidates.filter(c => (c.specs?.performance_score || 0) > (build.cpu.specs?.performance_score || 0)).sort((a,b) => (a.specs?.estimatedPrice || a.specs?.Price || 0) - (b.specs?.estimatedPrice || b.specs?.Price || 0))[0];
      let cheaperCpu = cpuCandidates.filter(c => (c.specs?.estimatedPrice || c.specs?.Price || 0) < (build.cpu.specs?.estimatedPrice || build.cpu.specs?.Price || 0)).sort((a,b) => (b.specs?.performance_score || 0) - (a.specs?.performance_score || 0))[0];
      build.cpu.alternatives = { better: betterCpu, cheaper: cheaperCpu };
  }
  if (build.gpu && build.gpu.id !== 'dummy_gpu') {
      let betterGpu = gpuCandidates.filter(c => (c.specs?.performance_score || 0) > (build.gpu.specs?.performance_score || 0)).sort((a,b) => (a.specs?.estimatedPrice || a.specs?.Price || 0) - (b.specs?.estimatedPrice || b.specs?.Price || 0))[0];
      let cheaperGpu = gpuCandidates.filter(c => (c.specs?.estimatedPrice || c.specs?.Price || 0) < (build.gpu.specs?.estimatedPrice || build.gpu.specs?.Price || 0)).sort((a,b) => (b.specs?.performance_score || 0) - (a.specs?.performance_score || 0))[0];
      build.gpu.alternatives = { better: betterGpu, cheaper: cheaperGpu };
  }

  return build;
}

// 헬퍼: 주어진 예산 내에서 가장 가성비/성능 점수가 높은 부품 선택
function selectBestPart(partList, targetBudget, isFallback = false) {
    if (!partList || partList.length === 0) return null;

    let availableParts = partList;

    // 타겟 예산의 50% ~ 150% 사이 부품 필터링
    let minBudget = targetBudget * 0.5;
    let maxBudget = targetBudget * 1.5;
    
    // 타겟 예산이 매우 높을 경우 상한선을 대폭 높여 하이엔드 부품을 적극적으로 찾음
    if (targetBudget > 1000000) {
        maxBudget = targetBudget * 3.0;
        minBudget = targetBudget * 0.7; // 하한선도 높임
    }

    let candidates = availableParts.filter(p => {
        const price = p.specs?.estimatedPrice || p.specs?.Price || 0;
        return price >= minBudget && price <= maxBudget;
    });

    // 그래도 없으면 마진을 넓힘
    if (candidates.length === 0) {
        candidates = availableParts.filter(p => {
            const price = p.specs?.estimatedPrice || p.specs?.Price || 0;
            return price >= targetBudget * 0.3 && price <= targetBudget * 2.5;
        });
    }

    // 완전히 없으면 fallback(themes 제외)으로 맡김
    if (candidates.length === 0) return null; 

    // 메인 부품 선택 알고리즘
    const mainPart = candidates.reduce((prev, curr) => {
        const prevScore = prev.specs?.performance_score || 0;
        const currScore = curr.specs?.performance_score || 0;
        
        // 고예산 하이엔드 셋팅일 경우 무조건 성능 점수가 최우선
        if (targetBudget > 800000 && (currScore !== prevScore)) {
            return currScore > prevScore ? curr : prev;
        }

        // 성능 점수가 같거나 예산이 낮을 경우 가격 근접도로 판단
        if (currScore === prevScore) {
            const prevPrice = prev.specs?.estimatedPrice || prev.specs?.Price || 0;
            const currPrice = curr.specs?.estimatedPrice || curr.specs?.Price || 0;
            
            // 타겟 예산 내에서 최대한 타겟에 가까운(약간 낮은) 부품 선호
            if (currPrice <= targetBudget && prevPrice <= targetBudget) {
                return currPrice > prevPrice ? curr : prev;
            }
            
            const prevDiff = Math.abs(prevPrice - targetBudget);
            const currDiff = Math.abs(currPrice - targetBudget);
            return currDiff < prevDiff ? curr : prev;
        }

        return currScore > prevScore ? curr : prev;
    });

    // 대안 부품 찾기 (가성비 / 하이엔드)
    const mainPrice = mainPart.specs?.estimatedPrice || mainPart.specs?.Price || targetBudget;
    const mainScore = mainPart.specs?.performance_score || 50;

    let cheaper = partList.filter(p => {
        const pPrice = p.specs?.estimatedPrice || p.specs?.Price || 0;
        return pPrice < mainPrice && pPrice >= mainPrice * 0.5; // 절반 가격까지만 허용
    }).sort((a, b) => (b.specs?.performance_score || 0) - (a.specs?.performance_score || 0))[0] || null;

    let better = partList.filter(p => {
        const pPrice = p.specs?.estimatedPrice || p.specs?.Price || 0;
        return pPrice > mainPrice && pPrice <= mainPrice * 1.8 && (p.specs?.performance_score || 0) > mainScore;
    }).sort((a, b) => (a.specs?.estimatedPrice || a.specs?.Price || 0) - (b.specs?.estimatedPrice || b.specs?.Price || 0))[0] || null;

    // 객체 복사 후 대안 정보 추가 (참조 문제 방지)
    const result = { ...mainPart, alternatives: {} };
    if (cheaper) result.alternatives.cheaper = cheaper;
    if (better) result.alternatives.better = better;

    return result;
}

module.exports = { generateDeterministicBuild, categorizeAndFilterParts };