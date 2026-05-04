const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const Reply = require('../models/Reply.model');
const Discussion = require('../models/Discussion.model');
const { createNotification, NOTIFICATION_TYPES } = require('../utils/notificationHelper');

// @desc    Get replies by discussion
// @route   GET /api/replies/:discussionId
// @access  Public
exports.getRepliesByDiscussion = asyncHandler(async (req, res, next) => {
  const replies = await Reply.find({ discussionId: req.params.discussionId })
    .populate('userId', 'name email')
    .sort({ createdAt: 1 });

  res.status(200).json({
    success: true,
    data: replies
  });
});

// @desc    Create new reply
// @route   POST /api/replies
// @access  Private
exports.createReply = asyncHandler(async (req, res, next) => {
  const { discussionId, content } = req.body;

  if (!discussionId) {
    return next(new AppError('Discussion ID is required', 400));
  }

  // Check if discussion exists
  const discussion = await Discussion.findById(discussionId);
  if (!discussion) {
    return next(new AppError('Discussion not found', 404));
  }

  const reply = await Reply.create({
    discussionId: discussionId,
    userId: req.user.id,
    content
  });

  // Create notification for discussion author (if not replying to own discussion)
  if (discussion.userId.toString() !== req.user.id) {
    await createNotification(
      discussion.userId,
      'New Reply',
      `Someone replied to your discussion "${discussion.title}"`,
      NOTIFICATION_TYPES.DISCUSSION_REPLY,
      reply._id,
      'Reply'
    );
  }

  res.status(201).json({
    success: true,
    message: 'Reply created successfully',
    data: reply
  });
});

// @desc    Update reply
// @route   PUT /api/replies/:id
// @access  Private
exports.updateReply = asyncHandler(async (req, res, next) => {
  let reply = await Reply.findById(req.params.id);

  if (!reply) {
    return next(new AppError('Reply not found', 404));
  }

  // Check ownership
  if (reply.userId.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('You are not authorized to update this reply', 403));
  }

  const { content } = req.body;

  reply = await Reply.findByIdAndUpdate(
    req.params.id,
    { content, updatedAt: Date.now() },
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    message: 'Reply updated successfully',
    data: reply
  });
});

// @desc    Delete reply
// @route   DELETE /api/replies/:id
// @access  Private
exports.deleteReply = asyncHandler(async (req, res, next) => {
  const reply = await Reply.findById(req.params.id);

  if (!reply) {
    return next(new AppError('Reply not found', 404));
  }

  // Check ownership
  if (reply.userId.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('You are not authorized to delete this reply', 403));
  }

  await Reply.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: 'Reply deleted successfully'
  });
});

// @desc    Like/unlike reply
// @route   POST /api/replies/:id/like
// @access  Private
exports.likeReply = asyncHandler(async (req, res, next) => {
  const reply = await Reply.findById(req.params.id);

  if (!reply) {
    return next(new AppError('Reply not found', 404));
  }

  // Check if already liked
  const likeIndex = reply.likes.indexOf(req.user.id);

  if (likeIndex > -1) {
    // Unlike
    reply.likes.splice(likeIndex, 1);
  } else {
    // Like
    reply.likes.push(req.user.id);
  }

  await reply.save();

  res.status(200).json({
    success: true,
    message: likeIndex > -1 ? 'Reply unliked' : 'Reply liked',
    data: {
      likes: reply.likes.length
    }
  });
});
