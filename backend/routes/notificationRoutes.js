const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  createNotification,
  deleteNotification,
  getNotificationStats
} = require('../controllers/notificationController');

// All routes require authentication
router.use(authenticateToken);

// Get notifications
router.get('/', getNotifications);
router.get('/stats', getNotificationStats);

// Manage notifications
router.post('/', createNotification);
router.put('/:notificationId/read', markAsRead);
router.put('/read-all', markAllAsRead);
router.delete('/:notificationId', deleteNotification);

module.exports = router;