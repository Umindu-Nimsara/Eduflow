const LiveClass = require('../models/LiveClass.model');
const Course = require('../models/Course.model');
const Enrollment = require('../models/Enrollment.model');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

// @desc    Create live class
// @route   POST /api/live-classes
// @access  Private (Instructor)
exports.createLiveClass = asyncHandler(async (req, res, next) => {
  const { courseId } = req.body;

  // Verify course ownership
  const course = await Course.findById(courseId);
  if (!course) {
    return next(new AppError('Course not found', 404));
  }

  if (course.instructorId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return next(new AppError('Not authorized to create live class for this course', 403));
  }

  const liveClass = await LiveClass.create({
    ...req.body,
    instructorId: req.user._id
  });

  res.status(201).json({
    success: true,
    data: liveClass
  });
});

// @desc    Get all live classes for a course
// @route   GET /api/live-classes/course/:courseId
// @access  Private
exports.getLiveClassesByCourse = asyncHandler(async (req, res, next) => {
  const { courseId } = req.params;
  const { status, upcoming } = req.query;

  const query = { courseId };

  if (status) {
    query.status = status;
  }

  if (upcoming === 'true') {
    query.scheduledDate = { $gte: new Date() };
    query.status = { $in: ['scheduled', 'live'] };
  }

  const liveClasses = await LiveClass.find(query)
    .populate('instructorId', 'name email')
    .sort({ scheduledDate: 1 });

  res.status(200).json({
    success: true,
    count: liveClasses.length,
    data: liveClasses
  });
});

// @desc    Get single live class
// @route   GET /api/live-classes/:id
// @access  Private
exports.getLiveClass = asyncHandler(async (req, res, next) => {
  const liveClass = await LiveClass.findById(req.params.id)
    .populate('instructorId', 'name email')
    .populate('attendees.userId', 'name email');

  if (!liveClass) {
    return next(new AppError('Live class not found', 404));
  }

  res.status(200).json({
    success: true,
    data: liveClass
  });
});

// @desc    Update live class
// @route   PUT /api/live-classes/:id
// @access  Private (Instructor)
exports.updateLiveClass = asyncHandler(async (req, res, next) => {
  let liveClass = await LiveClass.findById(req.params.id);

  if (!liveClass) {
    return next(new AppError('Live class not found', 404));
  }

  // Check ownership
  if (liveClass.instructorId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return next(new AppError('Not authorized to update this live class', 403));
  }

  liveClass = await LiveClass.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    data: liveClass
  });
});

// @desc    Delete live class
// @route   DELETE /api/live-classes/:id
// @access  Private (Instructor)
exports.deleteLiveClass = asyncHandler(async (req, res, next) => {
  const liveClass = await LiveClass.findById(req.params.id);

  if (!liveClass) {
    return next(new AppError('Live class not found', 404));
  }

  // Check ownership
  if (liveClass.instructorId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return next(new AppError('Not authorized to delete this live class', 403));
  }

  await liveClass.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Join live class (record attendance)
// @route   POST /api/live-classes/:id/join
// @access  Private
exports.joinLiveClass = asyncHandler(async (req, res, next) => {
  const liveClass = await LiveClass.findById(req.params.id);

  if (!liveClass) {
    return next(new AppError('Live class not found', 404));
  }

  // Check if already joined
  const existingAttendee = liveClass.attendees.find(
    a => a.userId.toString() === req.user._id.toString()
  );

  if (existingAttendee) {
    return next(new AppError('Already joined this class', 400));
  }

  liveClass.attendees.push({
    userId: req.user._id,
    joinedAt: new Date()
  });

  await liveClass.save();

  res.status(200).json({
    success: true,
    data: liveClass
  });
});

// @desc    Leave live class (record attendance)
// @route   POST /api/live-classes/:id/leave
// @access  Private
exports.leaveLiveClass = asyncHandler(async (req, res, next) => {
  const liveClass = await LiveClass.findById(req.params.id);

  if (!liveClass) {
    return next(new AppError('Live class not found', 404));
  }

  const attendee = liveClass.attendees.find(
    a => a.userId.toString() === req.user._id.toString()
  );

  if (!attendee) {
    return next(new AppError('Not joined this class', 400));
  }

  attendee.leftAt = new Date();
  attendee.duration = Math.round((attendee.leftAt - attendee.joinedAt) / 60000); // minutes

  await liveClass.save();

  res.status(200).json({
    success: true,
    data: liveClass
  });
});

// @desc    Get instructor's upcoming classes
// @route   GET /api/live-classes/instructor/upcoming
// @access  Private (Instructor)
exports.getInstructorUpcomingClasses = asyncHandler(async (req, res, next) => {
  const liveClasses = await LiveClass.find({
    instructorId: req.user._id,
    scheduledDate: { $gte: new Date() },
    status: { $in: ['scheduled', 'live'] }
  })
    .populate('courseId', 'title')
    .sort({ scheduledDate: 1 })
    .limit(10);

  res.status(200).json({
    success: true,
    count: liveClasses.length,
    data: liveClasses
  });
});
