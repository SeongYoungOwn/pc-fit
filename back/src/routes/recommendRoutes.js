const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const { recommendLimiter } = require('../config/rateLimiter');
const ctrl = require('../controllers/recommendController');
router.post('/', recommendLimiter,
  body('budget').isNumeric(),
  body('usage').isString(),
  (req, res, next) => { const e = validationResult(req); if (!e.isEmpty()) return res.status(400).json({ success: false, error: e.array() }); next(); },
  ctrl.recommend
);

router.post('/ai-review', recommendLimiter, ctrl.aiReview);

const modifyCtrl = require('../controllers/modifyBuildController');
router.post('/modify-build', recommendLimiter, modifyCtrl.modifyBuild);

const advisorCtrl = require('../controllers/advisorController');
router.post('/compare-advisor', recommendLimiter, advisorCtrl.compareAdvisor);
module.exports = router;