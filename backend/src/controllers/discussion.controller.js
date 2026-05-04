const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const Discussion = require('../models/Discussion.model');
const Course = require('../models/Course.model');
const { uploadToCloudinary } = require('../config/cloudinary');

// @desc    Get discussions by course
// @route   GET /api/discussions/:courseId
// @access  Public
exports.getDiscussionsByCourse = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const search = req.query.search || '';
  const category = req.query.category;
  const tags = req.query.tags;

  // Build query
  let query = { courseId: req.params.courseId };

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { content: { $regex: search, $options: 'i' } }
    ];
  }

  // Filter by category
  if (category && category !== 'all') {
    query.category = category;
  }

  // Filter by tags
  if (tags) {
    query.tags = { $in: tags.split(',').map(tag => tag.trim().toLowerCase()) };
  }

  const discussions = await Discussion.find(query)
    .populate('userId', 'name email')
    .sort({ isPinned: -1, createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Discussion.countDocuments(query);

  res.status(200).json({
    success: true,
    data: discussions,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      total,
      limit
    }
  });
});

// @desc    Get single discussion by ID
// @route   GET /api/discussions/:id
// @access  Public
exports.getDiscussionById = asyncHandler(async (req, res, next) => {
  const discussion = await Discussion.findById(req.params.id)
    .populate('userId', 'name email')
    .populate('likes', 'name');

  if (!discussion) {
    return next(new AppError('Discussion not found', 404));
  }

  res.status(200).json({
    success: true,
    data: discussion
  });
});

// @desc    Create new discussion
// @route   POST /api/discussions
// @access  Private
exports.createDiscussion = asyncHandler(async (req, res, next) => {
  const { courseId, title, content, attachment, category, tags } = req.body;

  if (!courseId) {
    return next(new AppError('Course ID is required', 400));
  }

  // Check if course exists
  const course = await Course.findById(courseId);
  if (!course) {
    return next(new AppError('Course not found', 404));
  }

  // Process tags (convert to lowercase and trim)
  const processedTags = tags && Array.isArray(tags) 
    ? tags.map(tag => tag.trim().toLowerCase()).filter(tag => tag.length > 0)
    : [];

  const discussion = await Discussion.create({
    courseId: courseId,
    userId: req.user.id,
    title,
    content,
    attachment: attachment || '',
    category: category || 'general',
    tags: processedTags
  });

  res.status(201).json({
    success: true,
    message: 'Discussion created successfully',
    data: discussion
  });
});

// @desc    Update discussion
// @route   PUT /api/discussions/:id
// @access  Private
exports.updateDiscussion = asyncHandler(async (req, res, next) => {
  let discussion = await Discussion.findById(req.params.id);

  if (!discussion) {
    return next(new AppError('Discussion not found', 404));
  }

  // Check ownership
  if (discussion.userId.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('You are not authorized to update this discussion', 403));
  }

  const { title, content, attachment, category, tags } = req.body;

  // Process tags if provided
  const processedTags = tags && Array.isArray(tags) 
    ? tags.map(tag => tag.trim().toLowerCase()).filter(tag => tag.length > 0)
    : undefined;

  const updateData = {
    updatedAt: Date.now()
  };

  if (title !== undefined) updateData.title = title;
  if (content !== undefined) updateData.content = content;
  if (attachment !== undefined) updateData.attachment = attachment;
  if (category !== undefined) updateData.category = category;
  if (processedTags !== undefined) updateData.tags = processedTags;

  discussion = await Discussion.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    message: 'Discussion updated successfully',
    data: discussion
  });
});

// @desc    Delete discussion
// @route   DELETE /api/discussions/:id
// @access  Private
exports.deleteDiscussion = asyncHandler(async (req, res, next) => {
  const discussion = await Discussion.findById(req.params.id);

  if (!discussion) {
    return next(new AppError('Discussion not found', 404));
  }

  // Check ownership
  if (discussion.userId.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('You are not authorized to delete this discussion', 403));
  }

  await Discussion.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: 'Discussion deleted successfully'
  });
});

// @desc    Like/unlike discussion
// @route   POST /api/discussions/:id/like
// @access  Private
exports.likeDiscussion = asyncHandler(async (req, res, next) => {
  const discussion = await Discussion.findById(req.params.id);

  if (!discussion) {
    return next(new AppError('Discussion not found', 404));
  }

  // Check if already liked
  const likeIndex = discussion.likes.indexOf(req.user.id);

  if (likeIndex > -1) {
    // Unlike
    discussion.likes.splice(likeIndex, 1);
  } else {
    // Like
    discussion.likes.push(req.user.id);
  }

  await discussion.save();

  res.status(200).json({
    success: true,
    message: likeIndex > -1 ? 'Discussion unliked' : 'Discussion liked',
    data: {
      likes: discussion.likes.length
    }
  });
});

// @desc    Pin/unpin discussion
// @route   PUT /api/discussions/:id/pin
// @access  Private (Instructor/Admin)
exports.pinDiscussion = asyncHandler(async (req, res, next) => {
  const discussion = await Discussion.findById(req.params.id).populate('courseId');

  if (!discussion) {
    return next(new AppError('Discussion not found', 404));
  }

  // Check if user is instructor of the course or admin
  if (discussion.courseId.instructorId.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('You are not authorized to pin this discussion', 403));
  }

  discussion.isPinned = !discussion.isPinned;
  await discussion.save();

  res.status(200).json({
    success: true,
    message: discussion.isPinned ? 'Discussion pinned' : 'Discussion unpinned',
    data: discussion
  });
});

// @desc    Upload discussion attachment
// @route   POST /api/discussions/upload
// @access  Private
exports.uploadAttachment = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError('Please upload a file', 400));
  }

  // Upload to Cloudinary
  const result = await uploadToCloudinary(req.file.buffer, 'discussions/attachments', 'raw');

  res.status(200).json({
    success: true,
    message: 'Attachment uploaded successfully',
    data: {
      url: result.secure_url
    }
  });
});

// @desc    Get all discussions (admin)
// @route   GET /api/discussions/admin/all
// @access  Private (Admin)
exports.getAllDiscussions = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;
  const search = req.query.search || '';

  // Build query
  let query = {};

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { content: { $regex: search, $options: 'i' } }
    ];
  }

  const discussions = await Discussion.find(query)
    .populate('userId', 'name email role')
    .populate('courseId', 'title')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Discussion.countDocuments(query);
  const totalPinned = await Discussion.countDocuments({ isPinned: true });

  res.status(200).json({
    success: true,
    data: discussions,
    stats: {
      total,
      totalPinned
    },
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      total,
      limit
    }
  });
});

// @desc    Add reply to discussion
// @route   POST /api/discussions/:id/reply
// @access  Private
exports.addReply = asyncHandler(async (req, res, next) => {
  const { content } = req.body;

  if (!content || !content.trim()) {
    return next(new AppError('Reply content is required', 400));
  }

  const discussion = await Discussion.findById(req.params.id);
  if (!discussion) {
    return next(new AppError('Discussion not found', 404));
  }

  const Reply = require('../models/Reply.model');
  const reply = await Reply.create({
    discussionId: req.params.id,
    userId: req.user.id,
    content: content.trim()
  });

  // Populate user info
  await reply.populate('userId', 'name email');

  // Create notification for discussion owner (if not replying to own discussion)
  if (discussion.userId.toString() !== req.user.id) {
    const { createNotification, NOTIFICATION_TYPES } = require('../utils/notificationHelper');
    await createNotification(
      discussion.userId,
      'New Reply',
      `${req.user.name} replied to your discussion "${discussion.title}"`,
      NOTIFICATION_TYPES.DISCUSSION_REPLY,
      discussion._id,
      'Discussion'
    );
  }

  res.status(201).json({
    success: true,
    message: 'Reply added successfully',
    data: reply
  });
});

// @desc    Get replies for discussion
// @route   GET /api/discussions/:id/replies
// @access  Public
exports.getReplies = asyncHandler(async (req, res, next) => {
  const Reply = require('../models/Reply.model');
  
  const replies = await Reply.find({ discussionId: req.params.id })
    .populate('userId', 'name email')
    .sort({ createdAt: 1 });

  res.status(200).json({
    success: true,
    data: replies,
    count: replies.length
  });
});

// @desc    Update reply
// @route   PUT /api/discussions/reply/:replyId
// @access  Private
exports.updateReply = asyncHandler(async (req, res, next) => {
  const { content } = req.body;
  const Reply = require('../models/Reply.model');

  let reply = await Reply.findById(req.params.replyId);

  if (!reply) {
    return next(new AppError('Reply not found', 404));
  }

  // Check ownership
  if (reply.userId.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('You are not authorized to update this reply', 403));
  }

  reply = await Reply.findByIdAndUpdate(
    req.params.replyId,
    { content: content.trim(), updatedAt: Date.now() },
    { new: true, runValidators: true }
  ).populate('userId', 'name email');

  res.status(200).json({
    success: true,
    message: 'Reply updated successfully',
    data: reply
  });
});

// @desc    Delete reply
// @route   DELETE /api/discussions/reply/:replyId
// @access  Private
exports.deleteReply = asyncHandler(async (req, res, next) => {
  const Reply = require('../models/Reply.model');
  
  const reply = await Reply.findById(req.params.replyId);

  if (!reply) {
    return next(new AppError('Reply not found', 404));
  }

  // Check ownership
  if (reply.userId.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('You are not authorized to delete this reply', 403));
  }

  await Reply.findByIdAndDelete(req.params.replyId);

  res.status(200).json({
    success: true,
    message: 'Reply deleted successfully'
  });
});

// @desc    Like/unlike reply
// @route   POST /api/discussions/reply/:replyId/like
// @access  Private
exports.likeReply = asyncHandler(async (req, res, next) => {
  const Reply = require('../models/Reply.model');
  
  const reply = await Reply.findById(req.params.replyId);

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
