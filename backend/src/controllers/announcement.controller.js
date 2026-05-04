const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const Announcement = require('../models/Announcement.model');
const User = require('../models/User.model');
const { createNotification, NOTIFICATION_TYPES } = require('../utils/notificationHelper');

// @desc    Get announcements
// @route   GET /api/announcements
// @access  Private
exports.getAnnouncements = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  // Build query based on user role
  let query = { isActive: true };

  if (req.user.role !== 'admin') {
    query.$or = [
      { targetRole: 'all' },
      { targetRole: req.user.role }
    ];
  }

  const announcements = await Announcement.find(query)
    .populate('createdBy', 'name')
    .populate('courseId', 'title')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Announcement.countDocuments(query);

  res.status(200).json({
    success: true,
    data: announcements,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      total,
      limit
    }
  });
});

// @desc    Create announcement
// @route   POST /api/announcements
// @access  Private (Admin, Instructor)
exports.createAnnouncement = asyncHandler(async (req, res, next) => {
  const { title, content, targetRole, courseId } = req.body;

  // If instructor, they can only create announcements for their courses
  if (req.user.role === 'instructor' && !courseId) {
    return next(new AppError('Instructors must specify a course for announcements', 400));
  }

  const announcement = await Announcement.create({
    createdBy: req.user.id,
    title,
    content,
    targetRole: targetRole || 'all',
    courseId: courseId || null,
    isActive: true
  });

  // Send notifications to target users
  let targetUsers = [];

  if (courseId) {
    // If course-specific, notify enrolled students
    const Enrollment = require('../models/Enrollment.model');
    const enrollments = await Enrollment.find({ courseId }).select('userId');
    targetUsers = enrollments.map(e => ({ _id: e.userId }));
  } else if (targetRole === 'all') {
    targetUsers = await User.find().select('_id');
  } else {
    targetUsers = await User.find({ role: targetRole }).select('_id');
  }

  // Create notifications for all target users
  const notificationPromises = targetUsers.map(user =>
    createNotification(
      user._id,
      'New Announcement',
      title,
      NOTIFICATION_TYPES.ANNOUNCEMENT,
      announcement._id,
      'Announcement'
    )
  );

  await Promise.all(notificationPromises);

  res.status(201).json({
    success: true,
    message: 'Announcement created and notifications sent',
    data: announcement
  });
});

// @desc    Update announcement
// @route   PUT /api/announcements/:id
// @access  Private (Admin)
exports.updateAnnouncement = asyncHandler(async (req, res, next) => {
  let announcement = await Announcement.findById(req.params.id);

  if (!announcement) {
    return next(new AppError('Announcement not found', 404));
  }

  const { title, content, targetRole, courseId, isActive } = req.body;

  announcement = await Announcement.findByIdAndUpdate(
    req.params.id,
    { title, content, targetRole, courseId, isActive },
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    message: 'Announcement updated successfully',
    data: announcement
  });
});

// @desc    Delete announcement
// @route   DELETE /api/announcements/:id
// @access  Private (Admin)
exports.deleteAnnouncement = asyncHandler(async (req, res, next) => {
  const announcement = await Announcement.findById(req.params.id);

  if (!announcement) {
    return next(new AppError('Announcement not found', 404));
  }

  await Announcement.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: 'Announcement deleted successfully'
  });
});

// @desc    Get all announcements (Admin only)
// @route   GET /api/announcements/admin/all
// @access  Private (Admin)
exports.getAllAnnouncements = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const announcements = await Announcement.find()
    .populate('createdBy', 'name email')
    .populate('courseId', 'title')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Announcement.countDocuments();

  res.status(200).json({
    success: true,
    data: announcements,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      total,
      limit
    }
  });
});

// @desc    Get single announcement
// @route   GET /api/announcements/:id
// @access  Private
exports.getAnnouncementById = asyncHandler(async (req, res, next) => {
  const announcement = await Announcement.findById(req.params.id)
    .populate('createdBy', 'name email')
    .populate('courseId', 'title');

  if (!announcement) {
    return next(new AppError('Announcement not found', 404));
  }

  res.status(200).json({
    success: true,
    data: announcement
  });
});
