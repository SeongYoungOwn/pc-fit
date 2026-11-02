const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
const anonKey = process.env.SUPABASE_ANON_KEY;

const supabaseKey = serviceKey || anonKey || '';

let supabase = null;

if (supabaseUrl && supabaseKey) {
  if (!serviceKey) {
    console.warn('⚠️ [Supabase] SERVICE_ROLE_KEY missing. Falling back to ANON_KEY. Writes might fail if RLS is enabled.');
  } else {
    console.log('✅ [Supabase] Initialized with SERVICE_ROLE_KEY.');
  }

  supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { 
      persistSession: false,
      autoRefreshToken: false
    }
  });
} else {
  console.error('❌ [Supabase] Configuration missing (URL or Key).');
}

module.exports = supabase;