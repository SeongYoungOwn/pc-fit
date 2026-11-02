const supabase = require('../config/supabase');

const requireAdmin = async (req, res, next) => {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ success: false, error: '로그인이 필요합니다.' });
    }
    
    // Check if the user is an admin from DB
    const { data: user, error } = await supabase.from('users').select('role').eq('id', req.session.userId).single();
    
    if (error || !user || user.role !== 'admin') {
      return res.status(403).json({ success: false, error: '관리자 권한이 필요합니다.' });
    }
    
    next();
  } catch (err) {
    console.error('[AdminMiddleware] Error:', err);
    return res.status(500).json({ success: false, error: '권한 확인 중 오류가 발생했습니다.' });
  }
};

module.exports = { requireAdmin };
