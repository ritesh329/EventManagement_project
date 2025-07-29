const express = require('express');
const router = express.Router();

const upload = require('../middleware/upload');
const Authcontroller = require('../controllers/authController');

const { verifyToken } = require('../middleware/authMiddleware');


router.get('/',verifyToken,Authcontroller.checkLogin);


router.get('/signUp',Authcontroller.getSignUp);
router.get('/login',Authcontroller.getlogin);
router.post('/signup', upload.single('profileImage'),Authcontroller.signup);
router.post('/login', Authcontroller.login);

router.get('/logout', Authcontroller.logout);


module.exports = router;
