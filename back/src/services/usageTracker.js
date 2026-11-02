const supabase = require('../config/supabase');

async function log({ user_id = null, api_type, endpoint = '', tokens_used = 0, status = 'success', response_time_ms = 0 }) {
  try {
    if (!supabase) return;
    await supabase.from('api_usage_logs').insert([{
      user_id, api_type, endpoint, tokens_used, status, response_time_ms,
      created_at: new Date().toISOString()
    }]);
  } catch (err) {
    console.error('[UsageTracker] Failed to log:', err.message);
  }
}

module.exports = { log };
