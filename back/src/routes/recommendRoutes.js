const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const { recommendLimiter } = require('../config/rateLimiter');
const ctrl = require('../controllers/recommendController');
router.post('/', recommendLimiter,
  body('budget').isInt({min:300000,max:5000000}).withMessage('예산은 30만~500만 원 사이의 정수로 입력해 주세요.'),
  body('usage').isIn(['gaming','work','stream','office']).withMessage('지원하는 PC 용도를 선택해 주세요.'),
  (req, res, next) => { const e = validationResult(req); if (!e.isEmpty()) return res.status(400).json({ success: false, error: e.array()[0].msg }); next(); },
  ctrl.recommend
);

router.post('/ai-review', recommendLimiter, ctrl.aiReview);

const modifyCtrl = require('../controllers/modifyBuildController');
router.post('/modify-build', recommendLimiter, modifyCtrl.modifyBuild);

const advisorCtrl = require('../controllers/advisorController');
router.post('/compare-advisor', recommendLimiter, advisorCtrl.compareAdvisor);
module.exports = router;
