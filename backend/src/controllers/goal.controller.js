const Goal = require('../models/Goal.model');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

exports.createGoal = asyncHandler(async (req, res, next) => {
  const goal = await Goal.create({
    ...req.body,
    userId: req.user._id
  });

  res.status(201).json({
    success: true,
    data: goal
  });
});

exports.getMyGoals = asyncHandler(async (req, res, next) => {
  const { status, category } = req.query;

  const query = { userId: req.user._id };
  if (status) query.status = status;
  if (category) query.category = category;

  const goals = await Goal.find(query)
    .populate('courseId', 'title')
    .sort({ targetDate: 1 });

  res.status(200).json({
    success: true,
    count: goals.length,
    data: goals
  });
});

exports.getGoal = asyncHandler(async (req, res, next) => {
  const goal = await Goal.findById(req.params.id).populate('courseId', 'title');

  if (!goal) {
    return next(new AppError('Goal not found', 404));
  }

  if (goal.userId.toString() !== req.user._id.toString() && !goal.isPublic) {
    return next(new AppError('Not authorized', 403));
  }

  res.status(200).json({
    success: true,
    data: goal
  });
});

exports.updateGoal = asyncHandler(async (req, res, next) => {
  let goal = await Goal.findById(req.params.id);

  if (!goal) {
    return next(new AppError('Goal not found', 404));
  }

  if (goal.userId.toString() !== req.user._id.toString()) {
    return next(new AppError('Not authorized', 403));
  }

  goal = await Goal.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    data: goal
  });
});

exports.updateProgress = asyncHandler(async (req, res, next) => {
  const { progress } = req.body;

  const goal = await Goal.findById(req.params.id);

  if (!goal) {
    return next(new AppError('Goal not found', 404));
  }

  if (goal.userId.toString() !== req.user._id.toString()) {
    return next(new AppError('Not authorized', 403));
  }

  goal.progress = progress;

  if (progress === 100 && goal.status !== 'completed') {
    goal.status = 'completed';
    goal.completedAt = new Date();
  } else if (progress > 0 && goal.status === 'not-started') {
    goal.status = 'in-progress';
  }

  await goal.save();

  res.status(200).json({
    success: true,
    data: goal
  });
});

exports.toggleMilestone = asyncHandler(async (req, res, next) => {
  const { id, milestoneId } = req.params;

  const goal = await Goal.findById(id);

  if (!goal) {
    return next(new AppError('Goal not found', 404));
  }

  if (goal.userId.toString() !== req.user._id.toString()) {
    return next(new AppError('Not authorized', 403));
  }

  const milestone = goal.milestones.id(milestoneId);
  if (!milestone) {
    return next(new AppError('Milestone not found', 404));
  }

  milestone.completed = !milestone.completed;
  milestone.completedAt = milestone.completed ? new Date() : null;

  // Update overall progress
  const completedMilestones = goal.milestones.filter(m => m.completed).length;
  goal.progress = Math.round((completedMilestones / goal.milestones.length) * 100);

  await goal.save();

  res.status(200).json({
    success: true,
    data: goal
  });
});

exports.deleteGoal = asyncHandler(async (req, res, next) => {
  const goal = await Goal.findById(req.params.id);

  if (!goal) {
    return next(new AppError('Goal not found', 404));
  }

  if (goal.userId.toString() !== req.user._id.toString()) {
    return next(new AppError('Not authorized', 403));
  }

  await goal.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});

exports.getGoalStats = asyncHandler(async (req, res, next) => {
  const goals = await Goal.find({ userId: req.user._id });

  const stats = {
    total: goals.length,
    completed: goals.filter(g => g.status === 'completed').length,
    inProgress: goals.filter(g => g.status === 'in-progress').length,
    notStarted: goals.filter(g => g.status === 'not-started').length,
    overdue: goals.filter(g => g.targetDate < new Date() && g.status !== 'completed').length,
    averageProgress: goals.reduce((sum, g) => sum + g.progress, 0) / (goals.length || 1)
  };

  res.status(200).json({
    success: true,
    data: stats
  });
});
