const errorHandler = (err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] ${err.stack || err.message}`);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || '서버 내부 오류가 발생했습니다.'
  });
};
module.exports = errorHandler;