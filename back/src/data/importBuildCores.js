
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.join(process.cwd(), 'back/.env') });
console.log('SUPABASE_URL:', process.env.SUPABASE_URL);

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

const BASE_DIR = path.join(__dirname, '../../../temp_buildcores_db/open-db');
console.log('BASE_DIR:', BASE_DIR);
const CATEGORIES = [
  'CPU', 'GPU', 'Motherboard', 'RAM', 'PSU', 'PCCase', 'Storage', 'CPUCooler', 'CaseFan'
];

async function setupSchema() {
  console.log('Setting up schema...');
  // Note: Usually we run SQL directly in Supabase UI, but for automation we could use RPC or just assume table exists.
  // We'll try to create the table using a simple query if possible, or just skip if we don't have enough permissions.
  // For this exercise, I'll provide the SQL separately but let's see if we can check it.
}

async function importCategory(category) {
  const dirPath = path.join(BASE_DIR, category);
  if (!fs.existsSync(dirPath)) {
    console.warn(`Category directory not found: ${category}`);
    return;
  }

  const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.json'));
  console.log(`Importing ${files.length} items for ${category}...`);

  const BATCH_SIZE = 100;
  for (let i = 0; i < files.length; i += BATCH_SIZE) {
    const batchFiles = files.slice(i, i + BATCH_SIZE);
    const items = batchFiles.map(file => {
      const content = JSON.parse(fs.readFileSync(path.join(dirPath, file), 'utf8'));
      return {
        id: content.opendb_id,
        category: category,
        name: content.metadata.name,
        manufacturer: content.metadata.manufacturer,
        specs: content
      };
    });

    const { error } = await supabase.from('parts').upsert(items, { onConflict: 'id' });
    if (error) {
      console.error(`Error importing batch for ${category}:`, error);
    } else {
      console.log(`Imported ${i + items.length}/${files.length} for ${category}`);
    }
  }
}

async function run() {
  // Check if table exists (or just try to insert)
  console.log('Starting import...');
  for (const category of CATEGORIES) {
    await importCategory(category);
  }
  console.log('Import finished!');
}

run().catch(console.error);
