const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const Feedback = require('../models/Feedback.model');
const Course = require('../models/Course.model');
const AdminLog = require('../models/AdminLog.model');

// @desc    Create feedback
// @route   POST /api/feedback
// @access  Private
exports.createFeedback = asyncHandler(async (req, res, next) => {
  const { courseId, rating, comment } = req.body;

  if (!courseId) {
    return next(new AppError('Course ID is required', 400));
  }

  // Check if course exists
  const course = await Course.findById(courseId);
  if (!course) {
    return next(new AppError('Course not found', 404));
  }

  // Check if user already submitted feedback for this course
  const existingFeedback = await Feedback.findOne({
    userId: req.user.id,
    courseId: courseId
  });

  if (existingFeedback) {
    return next(new AppError('You have already submitted feedback for this course', 400));
  }

  const feedback = await Feedback.create({
    courseId: courseId,
    userId: req.user.id,
    rating,
    comment,
    isApproved: true // Auto-approve - no admin approval needed
  });

  res.status(201).json({
    success: true,
    message: 'Feedback submitted successfully.',
    data: feedback
  });
});

// @desc    Get feedback by course
// @route   GET /api/feedback/:courseId
// @access  Public
exports.getFeedbackByCourse = asyncHandler(async (req, res, next) => {
  // Only show approved feedback to public
  const feedback = await Feedback.find({ 
    courseId: req.params.courseId,
    isApproved: true 
  })
    .populate('userId', 'name')
    .sort({ createdAt: -1 });

  // Calculate average rating
  const avgRating = feedback.length > 0
    ? feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length
    : 0;

  res.status(200).json({
    success: true,
    data: {
      feedback,
      avgRating: Math.round(avgRating * 10) / 10,
      totalReviews: feedback.length
    }
  });
});

// @desc    Approve feedback
// @route   PUT /api/feedback/:id/approve
// @access  Private (Admin)
exports.approveFeedback = asyncHandler(async (req, res, next) => {
  const feedback = await Feedback.findById(req.params.id);

  if (!feedback) {
    return next(new AppError('Feedback not found', 404));
  }

  feedback.isApproved = true;
  await feedback.save();

  // Log admin action
  await AdminLog.create({
    adminId: req.user.id,
    action: 'Approved feedback',
    targetId: req.params.id,
    targetModel: 'Feedback'
  });

  res.status(200).json({
    success: true,
    message: 'Feedback approved successfully',
    data: feedback
  });
});

// @desc    Update feedback
// @route   PUT /api/feedback/:id
// @access  Private (User - own feedback only)
exports.updateFeedback = asyncHandler(async (req, res, next) => {
  const { rating, comment } = req.body;

  const feedback = await Feedback.findById(req.params.id);

  if (!feedback) {
    return next(new AppError('Feedback not found', 404));
  }

  // Only the user who created the feedback can update it
  if (feedback.userId.toString() !== req.user.id) {
    return next(new AppError('You are not authorized to update this feedback', 403));
  }

  // Update fields
  if (rating !== undefined) {
    if (rating < 1 || rating > 5) {
      return next(new AppError('Rating must be between 1 and 5', 400));
    }
    feedback.rating = rating;
  }

  if (comment !== undefined) {
    feedback.comment = comment.trim();
  }

  await feedback.save();

  res.status(200).json({
    success: true,
    message: 'Feedback updated successfully',
    data: feedback
  });
});

// @desc    Delete feedback
// @route   DELETE /api/feedback/:id
// @access  Private
exports.deleteFeedback = asyncHandler(async (req, res, next) => {
  const feedback = await Feedback.findById(req.params.id);

  if (!feedback) {
    return next(new AppError('Feedback not found', 404));
  }

  // Users can delete their own feedback, admins can delete any
  if (feedback.userId.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('You are not authorized to delete this feedback', 403));
  }

  await Feedback.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: 'Feedback deleted successfully'
  });
});

// @desc    Get all pending feedback (admin)
// @route   GET /api/feedback/pending/all
// @access  Private (Admin)
exports.getPendingFeedback = asyncHandler(async (req, res, next) => {
  const feedback = await Feedback.find({ isApproved: false })
    .populate('userId', 'name email')
    .populate('courseId', 'title')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: feedback
  });
});

// @desc    Reply to feedback (instructor)
// @route   PUT /api/feedback/:id/reply
// @access  Private (Instructor - own courses only)
exports.replyToFeedback = asyncHandler(async (req, res, next) => {
  const { reply } = req.body;

  if (!reply || !reply.trim()) {
    return next(new AppError('Reply text is required', 400));
  }

  const feedback = await Feedback.findById(req.params.id).populate('courseId');

  if (!feedback) {
    return next(new AppError('Feedback not found', 404));
  }

  // Check if user is the instructor of the course
  if (feedback.courseId.instructorId.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('You are not authorized to reply to this feedback', 403));
  }

  feedback.instructorReply = reply.trim();
  feedback.repliedAt = Date.now();
  await feedback.save();

  res.status(200).json({
    success: true,
    message: 'Reply added successfully',
    data: feedback
  });
});

// @desc    Get all feedback (admin)
// @route   GET /api/feedback/admin/all
// @access  Private (Admin)
exports.getAllFeedback = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;
  const filter = req.query.filter || 'all'; // all, approved, pending

  // Build query
  let query = {};
  if (filter === 'approved') {
    query.isApproved = true;
  } else if (filter === 'pending') {
    query.isApproved = false;
  }

  const feedback = await Feedback.find(query)
    .populate('userId', 'name email role')
    .populate('courseId', 'title')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Feedback.countDocuments(query);
  const totalApproved = await Feedback.countDocuments({ isApproved: true });
  const totalPending = await Feedback.countDocuments({ isApproved: false });
  
  // Calculate average rating
  const allFeedback = await Feedback.find({ isApproved: true });
  const avgRating = allFeedback.length > 0
    ? allFeedback.reduce((sum, f) => sum + f.rating, 0) / allFeedback.length
    : 0;

  res.status(200).json({
    success: true,
    data: feedback,
    stats: {
      total,
      totalApproved,
      totalPending,
      avgRating: Math.round(avgRating * 10) / 10
    },
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      total,
      limit
    }
  });
});

// @desc    Vote feedback as helpful/not helpful
// @route   POST /api/feedback/:id/vote
// @access  Private
exports.voteHelpful = asyncHandler(async (req, res, next) => {
  const { helpful } = req.body; // true or false

  if (helpful === undefined) {
    return next(new AppError('Vote value is required (helpful: true or false)', 400));
  }

  const feedback = await Feedback.findById(req.params.id);

  if (!feedback) {
    return next(new AppError('Feedback not found', 404));
  }

  // Remove user from both arrays first (in case they're changing their vote)
  feedback.helpfulVotes = feedback.helpfulVotes.filter(
    id => id.toString() !== req.user.id
  );
  feedback.notHelpfulVotes = feedback.notHelpfulVotes.filter(
    id => id.toString() !== req.user.id
  );

  // Add to appropriate array
  if (helpful) {
    feedback.helpfulVotes.push(req.user.id);
  } else {
    feedback.notHelpfulVotes.push(req.user.id);
  }

  await feedback.save();

  res.status(200).json({
    success: true,
    message: helpful ? 'Marked as helpful' : 'Marked as not helpful',
    data: {
      helpfulCount: feedback.helpfulVotes.length,
      notHelpfulCount: feedback.notHelpfulVotes.length
    }
  });
});
