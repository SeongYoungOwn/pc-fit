const { generateDeterministicBuild } = require('./src/services/recommendationEngine');
require('dotenv').config();

const testCases = [
  { usage: 'gaming', budget: 1000000, desc: '게이밍 100만 (기대: RTX 4060급)' },
  { usage: 'gaming', budget: 2000000, desc: '게이밍 200만 (기대: RTX 5070급)' },
  { usage: 'gaming', budget: 3000000, desc: '게이밍 300만 (기대: RTX 5080/4080급)' },
  { usage: 'office', budget: 800000, desc: '사무용 80만 (기대: 내장그래픽)' },
  { usage: 'work', budget: 2000000, desc: '영상편집 200만 (기대: 코어 수 우선 CPU)' }
];

async function runTests() {
  console.log('| 용도/예산 | 추천 CPU | 추천 GPU | 총 견적(원) | 등급 | 사유 |');
  console.log('|---|---|---|---|---|---|');
  
  for (const tc of testCases) {
    try {
      const build = await generateDeterministicBuild(tc.budget, tc.usage);
      const parts = build; // build returned by generateDeterministicBuild
      const cpuName = parts.cpu?.name.split(' ').slice(0, 4).join(' ') || '-';
      const gpuName = parts.gpu?.name.split(' ').slice(0, 5).join(' ') || '-';
      const price = parts.cpu.specs.estimatedPrice + parts.gpu.specs.estimatedPrice; // simplified combo price for logging
      const estimatedTotal = (price / 0.65).toLocaleString();
      const reasons = parts.reasoning ? parts.reasoning.join(', ') : '-';
      console.log(`| ${tc.desc} | ${cpuName} | ${gpuName} | ${estimatedTotal} | **${parts.grade}** | ${reasons} |`);
    } catch (err) {
      console.log(`| ${tc.desc} | ERROR | ERROR | - | - | ${err.message} |`);
    }
  }
}

runTests();
