require('dotenv').config({ path: './.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const fs = require('fs');

async function backupDB() {
    console.log('Starting backup process...');
    
    // 1. Get original count
    const { count: origCount, error: countErr } = await supabase.from('parts').select('*', { count: 'exact', head: true });
    if (countErr) {
        console.error('Failed to get original count:', countErr);
        process.exit(1);
    }
    console.log(`Original parts table count: ${origCount}`);

    // 2. Fetch all rows (pagination needed)
    let allData = [];
    let page = 0;
    const limit = 1000;
    while (true) {
        const { data, error } = await supabase.from('parts').select('*').range(page * limit, (page + 1) * limit - 1);
        if (error) {
            console.error('Failed to fetch data:', error);
            process.exit(1);
        }
        if (!data || data.length === 0) break;
        allData = allData.concat(data);
        console.log(`Fetched ${allData.length} / ${origCount} records...`);
        if (data.length < limit) break;
        page++;
    }

    // 3. Save to backup file
    const backupFileName = `parts_backup_20260610.json`;
    fs.writeFileSync(backupFileName, JSON.stringify(allData, null, 2));
    console.log(`Backup saved to ${backupFileName}`);

    // 4. Verify backup
    const backupData = JSON.parse(fs.readFileSync(backupFileName, 'utf8'));
    if (backupData.length !== origCount) {
        console.error(`Validation FAILED! Original count: ${origCount}, Backup count: ${backupData.length}`);
        process.exit(1);
    }
    console.log(`Validation SUCCESS! Backup count (${backupData.length}) exactly matches original count (${origCount}).`);

    // 5. Delete all records
    console.log('Deleting all records from parts table in batches...');
    const batchSize = 500;
    for (let i = 0; i < allData.length; i += batchSize) {
        const batch = allData.slice(i, i + batchSize);
        const ids = batch.map(r => r.id);
        const { error } = await supabase.from('parts').delete().in('id', ids);
        if (error) {
            console.error('Failed to delete batch:', error);
            process.exit(1);
        }
        console.log(`Deleted ${Math.min(i + batchSize, allData.length)} / ${allData.length} records...`);
    }

    console.log('TRUNCATE (Deletion) COMPLETE. The parts table is now empty.');
}

backupDB();
