const router = require('express').Router();
const { query, validationResult } = require('express-validator');
const { youtubeLimiter } = require('../config/rateLimiter');
const ctrl = require('../controllers/youtubeController');
router.get('/benchmark', youtubeLimiter,
  query('cpu').isString().isLength({ min: 2 }), query('gpu').isString().isLength({ min: 2 }),
  (req, res, next) => { const e = validationResult(req); if (!e.isEmpty()) return res.status(400).json({ success: false, error: e.array()[0].msg }); next(); },
  ctrl.benchmark
);
module.exports = router;