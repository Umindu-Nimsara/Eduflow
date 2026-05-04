const express = require('express');
const { protect, restrictTo } = require('../middleware/auth.middleware');
const {
  getNotificationsByUser,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getAllNotifications,
  createNotificationAdmin,
  bulkDeleteNotifications
} = require('../controllers/notification.controller');
const Notification = require('../models/Notification.model');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

// Routes
router.get('/', protect, async (req, res, next) => {
  req.params.userId = req.user.id;
  return getNotificationsByUser(req, res, next);
});

// Unread count - must be before /:id routes
router.get('/unread-count', protect, asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({
    userId: req.user.id,
    isRead: false
  });
  res.status(200).json({ success: true, data: { count } });
}));

// Mark all as read - must be before /:id routes
router.put('/mark-all-read', protect, markAllAsRead);

// Admin routes
router.get('/admin/all', protect, restrictTo('admin'), getAllNotifications);
router.post('/admin/create', protect, restrictTo('admin'), createNotificationAdmin);
router.delete('/admin/bulk-delete', protect, restrictTo('admin'), bulkDeleteNotifications);

router.get('/:userId', protect, getNotificationsByUser);
router.put('/:id/read', protect, markAsRead);
router.delete('/:id', protect, deleteNotification);

module.exports = router;
