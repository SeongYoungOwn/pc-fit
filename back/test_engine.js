require('dotenv').config({ path: '.env' });
const { generateDeterministicBuild } = require('./src/services/recommendationEngine');

async function test() {
  try {
    console.log('--- TEST 1: Gaming, 1500000 KRW, AMD ---');
    const build1 = await generateDeterministicBuild(1500000, 'gaming', 'AMD');
    console.log(`CPU: ${build1.cpu.name} (Price: ${build1.cpu.specs.estimatedPrice})`);
    console.log(`GPU: ${build1.gpu.name} (Price: ${build1.gpu.specs.estimatedPrice})`);
    console.log(`MB:  ${build1.motherboard.name}`);
    console.log(`RAM: ${build1.ram.name}`);

    console.log('\n--- TEST 2: Office, 500000 KRW, 상관없음 ---');
    const build2 = await generateDeterministicBuild(500000, 'office', '상관없음');
    console.log(`CPU: ${build2.cpu.name} (Price: ${build2.cpu.specs.estimatedPrice})`);
    console.log(`GPU: ${build2.gpu.name} (Price: ${build2.gpu.specs.estimatedPrice})`);
    console.log(`MB:  ${build2.motherboard.name}`);
    
  } catch (e) {
    console.error('Error:', e.message);
  }
}
test();
