require('dotenv').config();
const supabase = require('./src/config/supabase');

async function test() {
  if (!supabase) {
    console.error('Supabase client not initialized. Check ENV.');
    return;
  }
  const { data, error } = await supabase.from('users').select('*').limit(1);
  if (error) {
    console.error('DB Error:', error.message);
  } else {
    console.log('Columns in users table:', data.length > 0 ? Object.keys(data[0]) : 'No data, but table exists.');
  }
}
test();
