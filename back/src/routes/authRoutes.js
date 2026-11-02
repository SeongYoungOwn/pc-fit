const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const { requireAuth } = require('../middleware/authMiddleware');
const ctrl = require('../controllers/authController');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, error: errors.array()[0].msg });
  next();
};

router.get('/check-username', ctrl.checkUsername);
router.get('/check-nickname', ctrl.checkNickname);

router.post('/signup',
  body('username').isLength({ min: 4 }).withMessage('아이디는 4자 이상이어야 합니다'),
  body('password').isLength({ min: 8 }).withMessage('비밀번호 8자 이상'),
  body('nickname').isLength({ min: 2 }).withMessage('닉네임 2자 이상'),
  validate, ctrl.signup
);
router.post('/login',
  body('username').notEmpty().withMessage('아이디를 입력하세요'), 
  body('password').notEmpty().withMessage('비밀번호를 입력하세요'),
  validate, ctrl.login
);
router.post('/logout', requireAuth, ctrl.logout);
router.get('/me', requireAuth, ctrl.me);
router.put('/my-pc', requireAuth, ctrl.updateMyPc);
module.exports = router;