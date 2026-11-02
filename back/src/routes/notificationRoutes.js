const router = require('express').Router();
const { requireAuth } = require('../middleware/authMiddleware');
const ctrl = require('../controllers/notificationController');

router.use(requireAuth);

router.get('/', ctrl.getNotifications);
router.put('/:id/read', ctrl.markAsRead);

module.exports = router;
