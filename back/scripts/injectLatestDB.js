require('dotenv').config({ path: './.env' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const DB_DIR = 'e:/2.work/myproject/temp_buildcores_db/open-db';

// Heuristic MSRP and Scores based on real-world data
function getCpuData(name) {
    let price = null;
    let score = 50;
    let tier = 'C';
    let igpu = name.includes('G') || !name.includes('F');
    
    // AMD
    if (name.includes('9950X')) { price = 950000; score = 250; tier = 'S'; }
    else if (name.includes('9900X')) { price = 700000; score = 230; tier = 'S'; }
    else if (name.includes('9700X')) { price = 550000; score = 200; tier = 'A'; }
    else if (name.includes('9600X')) { price = 400000; score = 170; tier = 'A'; }
    else if (name.includes('9800X3D')) { price = 650000; score = 350; tier = 'S'; igpu=true; }
    else if (name.includes('7950X3D')) { price = 850000; score = 280; tier = 'S'; igpu=true;}
    else if (name.includes('7800X3D')) { price = 550000; score = 290; tier = 'S'; igpu=true;}
    else if (name.includes('7600X')) { price = 300000; score = 160; tier = 'B'; }
    else if (name.includes('7600')) { price = 250000; score = 150; tier = 'B'; }
    else if (name.includes('5800X3D')) { price = 450000; score = 200; tier = 'A'; igpu=false;}
    else if (name.includes('5700X3D')) { price = 300000; score = 180; tier = 'A'; igpu=false;}
    else if (name.includes('5600X')) { price = 150000; score = 120; tier = 'C'; igpu=false;}
    else if (name.includes('8700G')) { price = 450000; score = 140; tier = 'B'; igpu=true;}
    else if (name.includes('8600G')) { price = 300000; score = 120; tier = 'C'; igpu=true;}
    
    // Intel
    else if (name.includes('14900K')) { price = 850000; score = 260; tier = 'S'; }
    else if (name.includes('14700K')) { price = 600000; score = 220; tier = 'A'; }
    else if (name.includes('14600K')) { price = 450000; score = 190; tier = 'A'; }
    else if (name.includes('13900K')) { price = 750000; score = 250; tier = 'S'; }
    else if (name.includes('13700K')) { price = 550000; score = 210; tier = 'A'; }
    else if (name.includes('13600K')) { price = 400000; score = 180; tier = 'B'; }
    else if (name.includes('12400F')) { price = 150000; score = 110; tier = 'C'; igpu=false;}
    else if (name.includes('Ultra 9 285K')) { price = 900000; score = 240; tier = 'S'; }
    else if (name.includes('Ultra 7 265K')) { price = 650000; score = 210; tier = 'A'; }
    else if (name.includes('Ultra 5 245K')) { price = 450000; score = 180; tier = 'B'; }

    return { price, score, tier, igpu };
}

function getGpuData(name) {
    let price = null;
    let score = 50;
    let tier = 'C';
    let cat = 'Gaming';
    
    if (name.includes('RTX 5090')) { price = 3200000; score = 400; tier = 'S'; }
    else if (name.includes('RTX 5080')) { price = 1800000; score = 320; tier = 'S'; }
    else if (name.includes('RTX 5070 Ti')) { price = 1300000; score = 280; tier = 'A'; }
    else if (name.includes('RTX 5070')) { price = 1000000; score = 250; tier = 'A'; }
    else if (name.includes('RTX 4090')) { price = 2800000; score = 350; tier = 'S'; }
    else if (name.includes('RTX 4080 SUPER')) { price = 1500000; score = 300; tier = 'S'; }
    else if (name.includes('RTX 4070 Ti SUPER')) { price = 1200000; score = 260; tier = 'A'; }
    else if (name.includes('RTX 4070 SUPER')) { price = 900000; score = 230; tier = 'A'; }
    else if (name.includes('RTX 4060 Ti')) { price = 550000; score = 160; tier = 'B'; }
    else if (name.includes('RTX 4060')) { price = 400000; score = 130; tier = 'C'; }
    else if (name.includes('RX 7900 XTX')) { price = 1400000; score = 310; tier = 'S'; }
    else if (name.includes('RX 7900 XT')) { price = 1100000; score = 270; tier = 'A'; }
    else if (name.includes('RX 7800 XT')) { price = 750000; score = 220; tier = 'A'; }
    else if (name.includes('RX 7600')) { price = 350000; score = 120; tier = 'C'; }
    
    if (name.includes('Quadro') || name.includes('PRO') || name.includes('RTX A')) cat = 'Workstation';
    if (name.includes('H100') || name.includes('A100') || name.includes('MI300')) cat = 'AI';
    
    return { price, score, tier, cat };
}

function getMbData(name, socket) {
    let price = 200000; // default average MB price
    if (name.includes('X670') || name.includes('Z790') || name.includes('Z890') || name.includes('X870') || name.includes('X570')) price = 450000;
    else if (name.includes('B650') || name.includes('B760') || name.includes('B850') || name.includes('B860') || name.includes('B550')) price = 200000;
    else if (name.includes('A620') || name.includes('H610') || name.includes('A520')) price = 100000;
    return { price };
}

function getRamData(name) {
    let price = 150000; // default 32GB
    if (name.includes('64GB')) price = 300000;
    else if (name.includes('16GB')) price = 70000;
    return { price };
}

function getSsdData(name) {
    let price = 150000; // default 1TB
    if (name.includes('2TB')) price = 280000;
    else if (name.includes('4TB')) price = 550000;
    else if (name.includes('500GB')) price = 70000;
    return { price };
}

function getPsuData(name) {
    let price = 100000; // default
    let wattage = parseInt(name.match(/(\d+)W/)?.[1] || 750);
    if (wattage >= 1000) price = 250000;
    else if (wattage >= 850) price = 180000;
    else if (wattage <= 600) price = 60000;
    return { price };
}

function readDirAndFilter(category, maxCount, filterFn, processFn) {
    const dir = path.join(DB_DIR, category);
    if (!fs.existsSync(dir)) return [];
    
    let files = fs.readdirSync(dir);
    let results = [];
    
    for (let file of files) {
        if (!file.endsWith('.json')) continue;
        const data = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
        if (filterFn(data)) {
            const processed = processFn(data);
            if (processed) results.push(processed);
        }
        if (results.length >= maxCount) break;
    }
    return results;
}

async function injectData() {
    let allParts = [];

    // CPUs
    console.log('Processing CPUs...');
    const cpus = readDirAndFilter('CPU', 100, 
        d => d.metadata.releaseYear >= 2022 || d.metadata.name.includes('X3D'),
        d => {
            const name = d.metadata.name;
            const { price, score, tier, igpu } = getCpuData(name);
            if (!price) return null; // Skip if we don't have a reliable price
            return {
                id: crypto.randomUUID(),
                name: name,
                category: 'CPU',
                manufacturer: d.metadata.manufacturer,
                specs: { 
                    socket: d.socket || 'Unknown',
                    generation: d.metadata.series || '',
                    release_year: d.metadata.releaseYear,
                    gaming_score: score,
                    productivity_score: score - 10,
                    tdp: d.specifications?.tdp || 65,
                    has_igpu: igpu,
                    price: price,
                    cpu_tier: tier,
                    platform: d.socket || 'Unknown',
                    Socket: d.socket || 'Unknown', 
                    Price: price 
                }
            };
        }
    );
    console.log(`Loaded ${cpus.length} CPUs`);
    allParts.push(...cpus);

    // GPUs
    console.log('Processing GPUs...');
    const gpus = readDirAndFilter('GPU', 100,
        d => d.metadata.name.includes('RTX 40') || d.metadata.name.includes('RTX 50') || d.metadata.name.includes('RX 7'),
        d => {
            const name = d.metadata.name;
            const { price, score, tier, cat } = getGpuData(name);
            if (!price) return null;
            return {
                id: crypto.randomUUID(),
                name: name,
                category: 'GPU',
                manufacturer: d.metadata.manufacturer || 'NVIDIA',
                specs: { 
                    socket: 'PCIe',
                    generation: d.metadata.series || '',
                    release_year: 2023,
                    gaming_score: score,
                    productivity_score: score,
                    tdp: d.specifications?.tdp || 250,
                    has_igpu: false,
                    price: price,
                    gpu_category: cat,
                    Price: price 
                }
            };
        }
    );
    console.log(`Loaded ${gpus.length} GPUs`);
    allParts.push(...gpus);

    // Motherboards
    console.log('Processing Motherboards...');
    const mbs = readDirAndFilter('Motherboard', 100,
        d => d.socket && (d.socket.includes('AM5') || d.socket.includes('AM4') || d.socket.includes('LGA 1700') || d.socket.includes('LGA 1851')),
        d => {
            const { price } = getMbData(d.metadata.name, d.socket);
            return {
                id: crypto.randomUUID(),
                name: d.metadata.name,
                category: 'Motherboard',
                manufacturer: d.metadata.manufacturer,
                specs: { 
                    socket: d.socket,
                    generation: '',
                    release_year: 2023,
                    price: price,
                    memory_type: d.socket.includes('AM4') ? 'DDR4' : 'DDR5',
                    Socket: d.socket, 
                    Price: price 
                }
            };
        }
    );
    console.log(`Loaded ${mbs.length} Motherboards`);
    allParts.push(...mbs);

    // RAM
    console.log('Processing RAM...');
    const rams = readDirAndFilter('RAM', 100,
        d => d.ram_type === 'DDR5' || d.ram_type === 'DDR4',
        d => {
            const name = d.metadata.name;
            const price = getRamData(name).price;
            return {
                id: crypto.randomUUID(),
                name: name,
                category: 'RAM',
                manufacturer: d.metadata.manufacturer,
                specs: { 
                    socket: d.ram_type,
                    type: d.ram_type,
                    price: price,
                    Price: price 
                }
            };
        }
    );
    console.log(`Loaded ${rams.length} RAMs`);
    allParts.push(...rams);

    // SSD
    console.log('Processing Storage...');
    const ssds = readDirAndFilter('Storage', 50,
        d => d.nvme === true || (d.type && d.type.includes('NVMe')),
        d => {
            const name = d.metadata.name;
            const price = getSsdData(name).price;
            return {
                id: crypto.randomUUID(),
                name: name,
                category: 'Storage',
                manufacturer: d.metadata.manufacturer,
                specs: { 
                    socket: 'M.2',
                    price: price,
                    Price: price 
                }
            };
        }
    );
    console.log(`Loaded ${ssds.length} SSDs`);
    allParts.push(...ssds);

    // PSU
    console.log('Processing PSUs...');
    const psus = readDirAndFilter('PSU', 50,
        d => d.wattage >= 600,
        d => {
            const name = d.metadata.name;
            const wattage = d.wattage;
            const price = getPsuData(`${wattage}W`).price;
            return {
                id: crypto.randomUUID(),
                name: name,
                category: 'PSU',
                manufacturer: d.metadata.manufacturer,
                specs: { 
                    socket: 'ATX',
                    price: price,
                    total_wattage: wattage, 
                    Price: price 
                }
            };
        }
    );
    console.log(`Loaded ${psus.length} PSUs`);
    allParts.push(...psus);

    // Case
    const casePrices = [15000, 30000, 50000, 100000];
    const cases = Array.from({length: 40}).map((_, i) => {
        const p = casePrices[i % 4];
        return {
            id: crypto.randomUUID(),
            name: `Standard ATX Case ${i+1} (${p/10000}만)`,
            category: 'Case',
            manufacturer: 'Various',
            specs: { socket: 'ATX', price: p, Price: p }
        };
    });
    allParts.push(...cases);

    // Cooler
    const coolerPrices = [5000, 15000, 40000, 100000];
    const coolers = Array.from({length: 40}).map((_, i) => {
        const p = coolerPrices[i % 4];
        return {
            id: crypto.randomUUID(),
            name: `CPU Cooler ${i+1} (${p/10000}만)`,
            category: 'Cooler',
            manufacturer: 'Various',
            specs: { socket: 'Universal', price: p, Price: p }
        };
    });
    allParts.push(...coolers);

    console.log(`\nTotal parts to inject: ${allParts.length}`);

    // Insert into Supabase in batches
    const batchSize = 100;
    for (let i = 0; i < allParts.length; i += batchSize) {
        const batch = allParts.slice(i, i + batchSize);
        const { error } = await supabase.from('parts').insert(batch);
        if (error) {
            console.error('Insert failed:', error);
        } else {
            console.log(`Inserted ${Math.min(i + batchSize, allParts.length)} / ${allParts.length}`);
        }
    }
    console.log('INJECTION COMPLETE!');
}

injectData();
