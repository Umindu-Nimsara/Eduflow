const Forum = require('../models/Forum.model');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

exports.createForumPost = asyncHandler(async (req, res, next) => {
  const forum = await Forum.create({
    ...req.body,
    authorId: req.user._id
  });

  await forum.populate('authorId', 'name email profilePicture');

  res.status(201).json({
    success: true,
    data: forum
  });
});

exports.getForumPosts = asyncHandler(async (req, res, next) => {
  const { courseId } = req.params;
  const { category } = req.query;

  const query = { courseId };
  if (category) query.category = category;

  const forums = await Forum.find(query)
    .populate('authorId', 'name email profilePicture')
    .populate('replies.userId', 'name email profilePicture')
    .sort({ isPinned: -1, createdAt: -1 });

  res.status(200).json({
    success: true,
    count: forums.length,
    data: forums
  });
});

exports.getForumPost = asyncHandler(async (req, res, next) => {
  const forum = await Forum.findById(req.params.id)
    .populate('authorId', 'name email profilePicture')
    .populate('replies.userId', 'name email profilePicture');

  if (!forum) {
    return next(new AppError('Forum post not found', 404));
  }

  forum.views += 1;
  await forum.save();

  res.status(200).json({
    success: true,
    data: forum
  });
});

exports.addReply = asyncHandler(async (req, res, next) => {
  const forum = await Forum.findById(req.params.id);

  if (!forum) {
    return next(new AppError('Forum post not found', 404));
  }

  if (forum.isLocked) {
    return next(new AppError('This forum post is locked', 400));
  }

  forum.replies.push({
    userId: req.user._id,
    content: req.body.content,
    createdAt: new Date()
  });

  await forum.save();
  await forum.populate('replies.userId', 'name email profilePicture');

  res.status(200).json({
    success: true,
    data: forum
  });
});

exports.togglePin = asyncHandler(async (req, res, next) => {
  const forum = await Forum.findById(req.params.id);

  if (!forum) {
    return next(new AppError('Forum post not found', 404));
  }

  forum.isPinned = !forum.isPinned;
  await forum.save();

  res.status(200).json({
    success: true,
    data: forum
  });
});

exports.toggleLock = asyncHandler(async (req, res, next) => {
  const forum = await Forum.findById(req.params.id);

  if (!forum) {
    return next(new AppError('Forum post not found', 404));
  }

  forum.isLocked = !forum.isLocked;
  await forum.save();

  res.status(200).json({
    success: true,
    data: forum
  });
});

exports.deleteForumPost = asyncHandler(async (req, res, next) => {
  const forum = await Forum.findById(req.params.id);

  if (!forum) {
    return next(new AppError('Forum post not found', 404));
  }

  if (forum.authorId.toString() !== req.user._id.toString() && req.user.role !== 'instructor' && req.user.role !== 'admin') {
    return next(new AppError('Not authorized', 403));
  }

  await forum.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});
