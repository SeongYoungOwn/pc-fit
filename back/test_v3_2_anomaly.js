require('dotenv').config();
const { generateDeterministicBuild } = require('./src/services/recommendationEngine');

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const usages = ['gaming', 'work', 'office'];

async function runAnomalyTests() {
  let stats = {
    total: 0,
    success: 0,
    errors: 0,
    anomalies: {
      a1_igpu: 0,
      a2_dummy: 0,
      a3_socket: 0,
      a4_power: 0,
      a5_gpu_cat: 0,
      a6_budget: 0
    },
    rejectReasons: {},
    cpuUsage: {},
    gpuUsage: {},
    grades: { S: 0, A: 0, B: 0, C: 0 },
    totalPrice: 0,
    totalBudgetUsage: 0,
    successfulBuilds: []
  };

  const iterations = 1000;
  console.log(`Starting ${iterations} anomaly tests...`);

  for (let i = 0; i < iterations; i++) {
    const usage = usages[getRandomInt(0, usages.length - 1)];
    const budget = getRandomInt(500000, 4000000);
    stats.total++;

    try {
      const build = await generateDeterministicBuild(budget, usage);
      const parts = build;
      
      const cpu = parts.cpu;
      const gpu = parts.gpu;
      const mb = parts.motherboard;
      const ram = parts.ram;
      const psu = parts.psu;

      const price = (cpu.specs.estimatedPrice || cpu.specs.Price || 0) + (gpu.specs.estimatedPrice || gpu.specs.Price || 0);
      const estimatedTotal = usage === 'office' ? price / 0.45 : price / 0.65;
      
      // Track pricing and grades
      stats.totalPrice += price;
      const budgetUsage = price / budget;
      stats.totalBudgetUsage += budgetUsage;

      let finalScore = build.finalScore || 0;
      let grade = 'C';
      if (finalScore >= 90) grade = 'S';
      else if (finalScore >= 80) grade = 'A';
      else if (finalScore >= 70) grade = 'B';
      stats.grades[grade]++;

      // Track usage
      stats.cpuUsage[cpu.name] = (stats.cpuUsage[cpu.name] || 0) + 1;
      stats.gpuUsage[gpu.name] = (stats.gpuUsage[gpu.name] || 0) + 1;

      // Anomaly 1: 내장그래픽 없는 CPU + 내장그래픽 견적
      if (gpu.id === 'dummy_gpu') {
        if (!cpu.specs.has_igpu) {
          stats.anomalies.a1_igpu++;
          console.warn(`[A1] No iGPU on CPU: ${cpu.name} with dummy_gpu`);
        }
      }

      // Anomaly 2: Dummy parts
      if (mb.id.startsWith('dummy_') || ram.id.startsWith('dummy_') || psu.id.startsWith('dummy_')) {
        stats.anomalies.a2_dummy++;
        console.warn(`[A2] Dummy part detected.`);
      }

      // Anomaly 3: Socket mismatch
      const cpuSocket = cpu.specs?.Socket;
      const mbSocket = mb.specs?.Socket;
      if (cpuSocket && mbSocket && !mbSocket.includes(cpuSocket)) {
        stats.anomalies.a3_socket++;
        console.warn(`[A3] Socket mismatch: CPU ${cpuSocket} vs MB ${mbSocket}`);
      }

      // Anomaly 4: Power shortage
      const cpuTdp = cpu.specs?.tdp || 65;
      const gpuTdp = gpu.specs?.tdp || 200;
      const reqPsu = Math.ceil(((cpuTdp + gpuTdp) * 1.5) / 50) * 50;
      const actPsu = psu.specs?.total_wattage || parseInt(psu.name.match(/(\d+)W/)?.[1]) || 0;
      if (actPsu > 0 && actPsu < reqPsu) {
        stats.anomalies.a4_power++;
        console.warn(`[A4] Power shortage: Req ${reqPsu}W vs Act ${actPsu}W`);
      }

      // Anomaly 5: AI GPU in Gaming
      if (usage === 'gaming' && gpu.gpu_category !== 'Gaming' && gpu.id !== 'dummy_gpu') {
        stats.anomalies.a5_gpu_cat++;
        console.warn(`[A5] Non-Gaming GPU in Gaming Build: ${gpu.name} (${gpu.gpu_category})`);
      }

      // Anomaly 6: Budget exceed 30%
      if (estimatedTotal > budget * 1.30) {
        stats.anomalies.a6_budget++;
        console.warn(`[A6] Budget exceeded by >30%: Target ${budget}, Est ${estimatedTotal}`);
      }

      stats.success++;
      if (stats.successfulBuilds.length < 100) {
        stats.successfulBuilds.push({
           budget, usage,
           cpu: cpu.name,
           gpu: gpu.name,
           mb: mb.name,
           ram: ram.name,
           grade,
           score: finalScore,
           estimatedTotal
        });
      }
    } catch (err) {
      stats.errors++;
      const reason = err.message || 'Unknown Error';
      stats.rejectReasons[reason] = (stats.rejectReasons[reason] || 0) + 1;
    }
  }

  console.log('\n=== TEST RESULTS ===');
  console.log(`Success Rate: ${((stats.success / stats.total) * 100).toFixed(1)}%`);
  console.log(`Reject Rate: ${((stats.errors / stats.total) * 100).toFixed(1)}%`);
  console.log(`Total Anomalies: ${Object.values(stats.anomalies).reduce((a, b) => a + b, 0)}`);
  
  if (stats.success > 0) {
    console.log(`\nAverage PC Price (Core parts): ${Math.floor(stats.totalPrice / stats.success).toLocaleString()} 원`);
    console.log(`Average Budget Usage: ${((stats.totalBudgetUsage / stats.success) * 100).toFixed(1)}%`);
    
    // Diversity Index (Simulated)
    const uniqueCpuCount = Object.keys(stats.cpuUsage).length;
    const uniqueGpuCount = Object.keys(stats.gpuUsage).length;
    console.log(`Recommendation Diversity: ${uniqueCpuCount} CPUs, ${uniqueGpuCount} GPUs used`);

    console.log('\n--- GRADES ---');
    console.log(`S: ${stats.grades.S} | A: ${stats.grades.A} | B: ${stats.grades.B} | C: ${stats.grades.C}`);

    console.log('\n--- TOP 20 CPUs ---');
    const sortedCpus = Object.entries(stats.cpuUsage).sort((a, b) => b[1] - a[1]);
    sortedCpus.slice(0, 20).forEach(([name, count], idx) => {
      const pct = ((count / stats.success) * 100).toFixed(1);
      const warn = count / stats.success > 0.3 ? ' [WARNING: >30%]' : '';
      console.log(`${idx + 1}. ${name} : ${count} (${pct}%)${warn}`);
    });

    console.log('\n--- TOP 20 GPUs ---');
    const sortedGpus = Object.entries(stats.gpuUsage).sort((a, b) => b[1] - a[1]);
    sortedGpus.slice(0, 20).forEach(([name, count], idx) => {
      const pct = ((count / stats.success) * 100).toFixed(1);
      const warn = count / stats.success > 0.3 ? ' [WARNING: >30%]' : '';
      console.log(`${idx + 1}. ${name} : ${count} (${pct}%)${warn}`);
    });
  }

  console.log('\n--- ANOMALIES (By Type) ---');
  console.log('A1 (No iGPU + Office): ' + stats.anomalies.a1_igpu);
  console.log('A2 (Dummy Parts):      ' + stats.anomalies.a2_dummy);
  console.log('A3 (Socket Mismatch):  ' + stats.anomalies.a3_socket);
  console.log('A4 (Power Shortage):   ' + stats.anomalies.a4_power);
  console.log('A5 (AI GPU in Gaming): ' + stats.anomalies.a5_gpu_cat);
  console.log('A6 (Budget >130%):     ' + stats.anomalies.a6_budget);
  
  console.log('\n--- REJECT REASONS TOP 20 ---');
  const sortedReasons = Object.entries(stats.rejectReasons).sort((a, b) => b[1] - a[1]);
  sortedReasons.slice(0, 20).forEach(([reason, count], idx) => {
    console.log(`${idx + 1}. [${count}건] ${reason}`);
  });

  const fs = require('fs');
  fs.writeFileSync('v_combo_report_100.json', JSON.stringify(stats.successfulBuilds, null, 2));
  console.log(`\nSaved ${stats.successfulBuilds.length} successful builds to v_combo_report_100.json`);
}

runAnomalyTests();
