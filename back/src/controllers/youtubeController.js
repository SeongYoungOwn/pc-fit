const { searchBenchmark } = require('../services/youtubeSearch');
exports.benchmark = async (req, res, next) => {
  try { res.json({ success: true, data: await searchBenchmark(req.query.cpu, req.query.gpu) }); }
  catch (e) { next(e); }
};