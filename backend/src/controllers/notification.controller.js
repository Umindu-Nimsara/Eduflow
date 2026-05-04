const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const Notification = require('../models/Notification.model');

// @desc    Get notifications by user
// @route   GET /api/notifications/:userId
// @access  Private
exports.getNotificationsByUser = asyncHandler(async (req, res, next) => {
  // Users can only view their own notifications, unless admin
  if (req.params.userId !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('You are not authorized to view these notifications', 403));
  }

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const notifications = await Notification.find({ userId: req.params.userId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Notification.countDocuments({ userId: req.params.userId });
  const unreadCount = await Notification.countDocuments({ 
    userId: req.params.userId, 
    isRead: false 
  });

  res.status(200).json({
    success: true,
    data: notifications,
    unreadCount,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      total,
      limit
    }
  });
});

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
exports.markAsRead = asyncHandler(async (req, res, next) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    return next(new AppError('Notification not found', 404));
  }

  // Check ownership
  if (notification.userId.toString() !== req.user.id) {
    return next(new AppError('You are not authorized to update this notification', 403));
  }

  notification.isRead = true;
  await notification.save();

  res.status(200).json({
    success: true,
    message: 'Notification marked as read',
    data: notification
  });
});

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
exports.markAllAsRead = asyncHandler(async (req, res, next) => {
  await Notification.updateMany(
    { userId: req.user.id, isRead: false },
    { isRead: true }
  );

  res.status(200).json({
    success: true,
    message: 'All notifications marked as read'
  });
});

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
exports.deleteNotification = asyncHandler(async (req, res, next) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    return next(new AppError('Notification not found', 404));
  }

  // Check ownership or admin
  if (notification.userId.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('You are not authorized to delete this notification', 403));
  }

  await Notification.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: 'Notification deleted successfully'
  });
});

// @desc    Get all notifications (Admin only)
// @route   GET /api/notifications/admin/all
// @access  Private (Admin)
exports.getAllNotifications = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const skip = (page - 1) * limit;

  const notifications = await Notification.find()
    .populate('userId', 'name email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Notification.countDocuments();
  const unreadTotal = await Notification.countDocuments({ isRead: false });

  res.status(200).json({
    success: true,
    data: notifications,
    unreadTotal,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      total,
      limit
    }
  });
});

// @desc    Create notification (Admin only)
// @route   POST /api/notifications/admin/create
// @access  Private (Admin)
exports.createNotificationAdmin = asyncHandler(async (req, res, next) => {
  const { userId, title, message, type, relatedId, relatedModel } = req.body;

  const notification = await Notification.create({
    userId,
    title,
    message,
    type,
    relatedId,
    relatedModel
  });

  res.status(201).json({
    success: true,
    message: 'Notification created successfully',
    data: notification
  });
});

// @desc    Bulk delete notifications (Admin only)
// @route   DELETE /api/notifications/admin/bulk-delete
// @access  Private (Admin)
exports.bulkDeleteNotifications = asyncHandler(async (req, res, next) => {
  const { notificationIds } = req.body;

  if (!notificationIds || !Array.isArray(notificationIds)) {
    return next(new AppError('Please provide an array of notification IDs', 400));
  }

  await Notification.deleteMany({ _id: { $in: notificationIds } });

  res.status(200).json({
    success: true,
    message: `${notificationIds.length} notifications deleted successfully`
  });
});
