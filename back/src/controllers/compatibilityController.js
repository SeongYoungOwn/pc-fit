const { checkCompatibility } = require('../services/compatibilityEngine');
exports.check = (req, res, next) => {
  try { res.json({ success: true, data: checkCompatibility(req.body.parts) }); }
  catch (e) { next(e); }
};