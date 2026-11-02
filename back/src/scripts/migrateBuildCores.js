const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const DB_PATH = path.join(__dirname, '../../../temp_buildcores_db/open-db');

const CATEGORY_MAP = {
  'CPU': 'CPU',
  'GPU': 'GPU',
  'Motherboard': 'Motherboard',
  'RAM': 'RAM',
  'Storage': 'Storage',
  'PSU': 'PSU',
  'CPUCooler': 'Cooler',
  'PCCase': 'Case'
};

async function migrate() {
  console.log('🚀 Starting BuildCores DB Migration...');

  console.log('🗑️ Clearing existing parts data...');
  await supabase.from('parts').delete().neq('id', 0);

  for (const [folder, mappedCategory] of Object.entries(CATEGORY_MAP)) {
    const folderPath = path.join(DB_PATH, folder);
    if (!fs.existsSync(folderPath)) {
      console.warn(`⚠️ Folder not found: ${folderPath}`);
      continue;
    }

    const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.json'));
    console.log(`\n📂 Processing category [${mappedCategory}] - ${files.length} parts found.`);

    let batch = [];
    let processed = 0;

    for (const file of files) {
      const filePath = path.join(folderPath, file);
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

      const name = data.metadata?.name || data.name || 'Unknown';
      const manufacturer = data.metadata?.manufacturer || data.manufacturer || 'Unknown';
      
      // 스펙 데이터를 보기 좋게 평탄화(Flatten) 하거나 필요한 정보만 추출
      const specs = {
        ...data.specifications,
        ...data.general_product_information,
        opendb_id: data.opendb_id,
        socket: data.socket || data.specifications?.socket || null,
        formFactor: data.formFactor || data.specifications?.formFactor || null,
        wattage: data.specifications?.wattage || null,
        tdp: data.specifications?.tdp || null
      };

      batch.push({
        name,
        category: mappedCategory,
        manufacturer,
        specs
      });

      // 100개씩 끊어서 Supabase에 INSERT
      if (batch.length === 100) {
        const { error } = await supabase.from('parts').insert(batch);
        if (error) console.error(`❌ Batch Insert Error for ${mappedCategory}:`, error.message);
        processed += batch.length;
        process.stdout.write(`\r✅ Inserted ${processed}/${files.length}`);
        batch = [];
      }
    }

    // 남은 찌꺼기 INSERT
    if (batch.length > 0) {
      const { error } = await supabase.from('parts').insert(batch);
      if (error) console.error(`❌ Batch Insert Error for ${mappedCategory}:`, error.message);
      processed += batch.length;
      process.stdout.write(`\r✅ Inserted ${processed}/${files.length}`);
    }
  }

  console.log('\n\n🎉 Migration Complete!');
}

migrate();
