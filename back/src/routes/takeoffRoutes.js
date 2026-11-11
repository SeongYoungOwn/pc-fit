const router = require('express').Router();
const { requireAuth } = require('../middleware/authMiddleware');
const ctrl = require('../controllers/takeoffController');
router.use((req,res,next)=>{
  if (!require('../config/supabase')) return res.status(503).json({success:false,code:'COMMUNITY_DB_NOT_CONFIGURED',error:'게시판 기능용 Supabase DB가 아직 연결되지 않았습니다.'});
  next();
});

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
