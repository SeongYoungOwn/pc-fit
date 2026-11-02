const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../middleware/adminMiddleware');
const adminController = require('../controllers/adminController');

router.use(requireAdmin); // All admin routes require admin

router.get('/dashboard', adminController.getDashboard);
router.get('/users', adminController.getUsers);
router.get('/api-usage', adminController.getApiUsage);
router.get('/token-usage', adminController.getTokenUsage);

module.exports = router;
