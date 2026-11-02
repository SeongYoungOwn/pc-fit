const router = require('express').Router();
const { requireAuth } = require('../middleware/authMiddleware');
const ctrl = require('../controllers/takeoffController');

router.get('/', ctrl.list);
router.get('/me/posts', requireAuth, ctrl.getMyPosts);
router.get('/me/comments', requireAuth, ctrl.getMyComments);
router.get('/:buildId', ctrl.getDetail);
router.post('/', requireAuth, ctrl.create);
router.post('/:buildId/vote', requireAuth, ctrl.vote);

router.get('/:buildId/comments', ctrl.getComments);
router.post('/:buildId/comments', requireAuth, ctrl.addComment);
router.delete('/:buildId/comments/:commentId', requireAuth, ctrl.deleteComment);

router.delete('/:buildId', requireAuth, ctrl.deleteTakeoff);

module.exports = router;