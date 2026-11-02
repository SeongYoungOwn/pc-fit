const supabase = require('../config/supabase');
const bcrypt = require('bcryptjs');

async function seedAdmin() {
  try {
    const ADMIN_USERNAME = '123456789';
    const ADMIN_PASSWORD = '123456789';
    
    if (!supabase) return;

    const { data: existing } = await supabase.from('users').select('id, role').eq('username', ADMIN_USERNAME).single();
    if (existing) {
      if (existing.role !== 'admin') {
        await supabase.from('users').update({ role: 'admin' }).eq('username', ADMIN_USERNAME);
        console.log('[Admin Seed] Admin account already exists, role updated to admin.');
      } else {
        console.log('[Admin Seed] Admin account already exists, role verified.');
      }
      return;
    }
    
    const hashed = await bcrypt.hash(ADMIN_PASSWORD, 10);
    const { error } = await supabase.from('users').insert([{
      username: ADMIN_USERNAME,
      password: hashed,
      nickname: '관리자',
      user_level: 'expert',
      role: 'admin'
    }]);

    if (error) throw error;
    console.log('[Admin Seed] Admin account created successfully.');
  } catch (err) {
    console.error('[Admin Seed] Error:', err.message);
  }
}

module.exports = { seedAdmin };
