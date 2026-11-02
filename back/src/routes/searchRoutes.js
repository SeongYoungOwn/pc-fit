const router = require('express').Router();
const { query, validationResult } = require('express-validator');
const { searchLimiter } = require('../config/rateLimiter');
const ctrl = require('../controllers/searchController');
router.get('/parts', searchLimiter,
  query('keyword').isString().isLength({ min: 2 }), query('type').isIn(['cpu','gpu','ram','motherboard','storage','psu','cooler']),
  (req, res, next) => { const e = validationResult(req); if (!e.isEmpty()) return res.status(400).json({ success: false, error: e.array()[0].msg }); next(); },
  ctrl.searchParts
);

router.get('/parts-db', searchLimiter,
  query('keyword').isString().isLength({ min: 1 }), query('type').isIn(['cpu','gpu','ram','motherboard','storage','psu','cooler']),
  (req, res, next) => { const e = validationResult(req); if (!e.isEmpty()) return res.status(400).json({ success: false, error: e.array()[0].msg }); next(); },
  ctrl.searchPartsInDB
);

router.get('/part-detail', searchLimiter,
  query('name').isString().isLength({ min: 1 }), query('type').isString(),
  (req, res, next) => { const e = validationResult(req); if (!e.isEmpty()) return res.status(400).json({ success: false, error: e.array()[0].msg }); next(); },
  ctrl.getPartDetail
);
module.exports = router;