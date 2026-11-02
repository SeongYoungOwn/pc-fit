require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const { categorizeAndFilterParts } = require('./src/services/recommendationEngine');

const getCpuTier = (name) => {
    const n = name.toUpperCase();
    if (n.includes('I9') || n.includes('9950X') || n.includes('7950X')) return 1;
    if (n.includes('I7') || n.includes('9900X') || n.includes('7900X') || n.includes('9800X3D')) return 2;
    if (n.includes('I5') || n.includes('9700X') || n.includes('7700X') || n.includes('9600X')) return 3;
    if (n.includes('I3') || n.includes('7600') || n.includes('4600G') || n.includes('5600G')) return 4;
    return 5;
};

const getGpuTier = (name) => {
    const n = name.toUpperCase();
    if (n.includes('5090') || n.includes('4090')) return 1;
    if (n.includes('5080') || n.includes('4080')) return 2;
    if (n.includes('5070') || n.includes('4070')) return 3;
    if (n.includes('5060') || n.includes('4060')) return 4;
    return 5;
};

async function analyzeScores() {
    const { data: allParts } = await supabase.from('parts').select('id, name, category, specs, manufacturer');
    const partsMap = categorizeAndFilterParts(allParts);

    const totalBudget = 2000000;
    const usage = 'gaming';

    let cpuCandidates = partsMap.CPU;
    let gpuCandidates = partsMap.GPU.filter(p => p.gpu_category === 'Gaming');

    // Find RTX 5070 or use dummy
    const targetGpu = gpuCandidates.find(g => g.name.includes('5070')) || gpuCandidates[0];
    const gpuPrice = targetGpu.specs.estimatedPrice || targetGpu.specs.Price || 0;
    const gpuPerf = targetGpu.specs.performance_score || 50;

    const maxCpuPerf = Math.max(...cpuCandidates.map(c => c.specs?.performance_score || 0));

    const results = [];

    for (const cpu of cpuCandidates) {
        const cpuPrice = cpu.specs.estimatedPrice || cpu.specs.Price || 0;
        const cpuPerf = cpu.specs.performance_score || 50;

        const comboPrice = cpuPrice + gpuPrice;
        if (comboPrice > totalBudget * 1.10) continue; // 110% 예산 필터

        // 1. Gaming Score (최고성능 대비 정규화)
        const cpuGamingScore = (cpuPerf / maxCpuPerf) * 100;
        const gpuGamingScore = (gpuPerf / 300) * 100; // 대략 5080을 300으로 가정
        const rawGamingScore = (cpuGamingScore * 0.3) + (gpuGamingScore * 0.7);

        // 2. Budget Score
        const budgetUsage = comboPrice / totalBudget;
        let budgetFitScore = 0;
        if (budgetUsage >= 0.95 && budgetUsage <= 1.05) budgetFitScore = 100;
        else if (budgetUsage > 1.05) budgetFitScore = Math.max(0, 100 - (budgetUsage - 1.05) * 1000);
        else budgetFitScore = Math.max(0, 100 - (0.95 - budgetUsage) * 100);

        // 3. Platform Score
        let platformScore = 0;
        const socket = cpu.specs?.Socket || '';
        if (socket === 'AM5' || socket === 'LGA 1700') platformScore = 100;
        else if (socket === 'AM4' || socket === 'LGA 1200') platformScore = 60;
        else platformScore = 30;

        // 4. Bottleneck Penalty
        let bottleneckPenalty = 0;
        const cTier = getCpuTier(cpu.name);
        const gTier = getGpuTier(targetGpu.name);
        if (Math.abs(cTier - gTier) >= 2) bottleneckPenalty = 15;

        // 5. Compatibility Penalty
        let compPenalty = 0;
        const compatibleMBs = partsMap.Motherboard.filter(mb => (mb.specs?.Socket || '') === socket);
        if (compatibleMBs.length === 0) compPenalty = 20;

        // Final Score (70 / 20 / 10 비중)
        const finalScore = (rawGamingScore * 0.7) + (budgetFitScore * 0.2) + (platformScore * 0.1) - bottleneckPenalty - compPenalty;

        results.push({
            name: cpu.name,
            price: cpuPrice,
            socket: socket,
            cpuPerf: cpuPerf,
            rawGaming: rawGamingScore.toFixed(1),
            budgetUsage: (budgetUsage * 100).toFixed(1) + '%',
            budgetFit: budgetFitScore.toFixed(1),
            platform: platformScore,
            bottleneck: bottleneckPenalty,
            comp: compPenalty,
            finalScore: finalScore.toFixed(2)
        });
    }

    results.sort((a, b) => parseFloat(b.finalScore) - parseFloat(a.finalScore));

    console.log(`\n=== CPU 선택 랭킹 상위 20개 (Target: 200만 원, 짝꿍 GPU: ${targetGpu.name}) ===`);
    console.table(results.slice(0, 20));

    const i9 = results.find(r => r.name.includes('10900X'));
    if (i9) {
        console.log(`\n=== 10900X 상세 분석 리포트 ===`);
        console.log(`CPU: ${i9.name} (소켓: ${i9.socket})`);
        console.log(`성능 점수: ${i9.cpuPerf}점 / 예산 사용률: ${i9.budgetUsage}`);
        console.log(`[+] Gaming Score (70% 반영) : ${i9.rawGaming}점 -> ${(i9.rawGaming * 0.7).toFixed(1)}점`);
        console.log(`[+] Budget Score (20% 반영) : ${i9.budgetFit}점 -> ${(i9.budgetFit * 0.2).toFixed(1)}점`);
        console.log(`[+] Platform Score (10% 반영): ${i9.platform}점 -> ${(i9.platform * 0.1).toFixed(1)}점`);
        console.log(`[-] Bottleneck Penalty      : -${i9.bottleneck}점`);
        console.log(`[-] Compatibility Penalty   : -${i9.comp}점`);
        console.log(`=========================================`);
        console.log(`>> 최종 점수 (Final Score)  : ${i9.finalScore}점`);
    } else {
        console.log('\n10900X가 후보에 없습니다.');
    }
}

analyzeScores();
