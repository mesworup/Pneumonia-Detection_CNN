const express = require('express');
const router = express.Router();
const { register, login, getProfile, updatePassword } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.get('/profile', protect, getProfile);
router.put('/password', protect, updatePassword);

module.exports = router;
