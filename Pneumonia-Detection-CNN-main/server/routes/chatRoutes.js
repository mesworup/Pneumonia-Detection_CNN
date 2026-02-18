const express = require('express');
const router = express.Router();
const { analyzeReport } = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, analyzeReport);

module.exports = router;
