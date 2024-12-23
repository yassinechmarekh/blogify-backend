const router = require('express').Router();
const { registerController, loginController } =require('../controllers/authController');

// api/auth/register
router.post('/register', registerController);

// api/auth/login
router.post('/login', loginController);

module.exports = router;