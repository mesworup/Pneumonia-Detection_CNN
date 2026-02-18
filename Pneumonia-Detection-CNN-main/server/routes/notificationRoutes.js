const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead
} = require('../controllers/notificationController');

// All routes require authentication
router.use(protect);

// Get notifications for logged-in user (paginated)
router.get('/', getNotifications);

// Get unread notification count
router.get('/unread-count', getUnreadCount);

// Mark specific notification as read
router.put('/:id/read', markAsRead);

// Mark all notifications as read
router.put('/read-all', markAllAsRead);

module.exports = router;
