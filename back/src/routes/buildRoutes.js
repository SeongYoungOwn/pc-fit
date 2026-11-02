const router = require('express').Router();
const { requireAuth, optionalAuth } = require('../middleware/authMiddleware');
const ctrl = require('../controllers/buildController');
router.post('/', requireAuth, ctrl.create);
router.get('/', requireAuth, ctrl.getMyBuilds);
router.get('/:id', optionalAuth, ctrl.getById);
router.patch('/:id/status', requireAuth, ctrl.updateStatus);
router.delete('/:id', requireAuth, ctrl.remove);
module.exports = router;