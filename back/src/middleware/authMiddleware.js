const requireAuth = (req, res, next) => {
  if (!req.session?.userId) {
    return res.status(401).json({ success: false, error: '로그인이 필요합니다.' });
  }
  next();
};

const optionalAuth = (req, res, next) => {
  // 세션 있으면 userId 세팅, 없어도 통과
  next();
};

module.exports = { requireAuth, optionalAuth };