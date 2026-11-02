const rateLimit = require('express-rate-limit');
const createLimiter = (windowMs, max, message) => rateLimit({
  windowMs, max, standardHeaders: true, legacyHeaders: false,
  message: { success: false, error: message }
});
module.exports = {
  recommendLimiter: createLimiter(60000, 5, 'AI 요청이 너무 많습니다. 1분 후 다시 시도해주세요.'),
  searchLimiter: createLimiter(60000, 30, '검색 요청이 너무 많습니다.'),
  youtubeLimiter: createLimiter(60000, 10, '영상 검색 요청이 너무 많습니다.'),
  generalLimiter: createLimiter(60000, 60, '요청이 너무 많습니다.')
};