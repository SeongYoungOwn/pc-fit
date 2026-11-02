const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const ctrl = require('../controllers/compatibilityController');
router.post('/check',
  body('parts').isObject(),
  (req, res, next) => { const e = validationResult(req); if (!e.isEmpty()) return res.status(400).json({ success: false, error: e.array()[0].msg }); next(); },
  ctrl.check
);
module.exports = router;