const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const Badge = require('../models/Badge.model');
const UserBadge = require('../models/UserBadge.model');
const Enrollment = require('../models/Enrollment.model');
const QuizAttempt = require('../models/QuizAttempt.model');
const Discussion = require('../models/Discussion.model');
const Streak = require('../models/Streak.model');

// @desc    Get all badges
// @route   GET /api/badges
// @access  Private
exports.getAllBadges = asyncHandler(async (req, res, next) => {
  const badges = await Badge.find().sort({ name: 1 });

  res.status(200).json({
    success: true,
    data: badges
  });
});

// @desc    Get user badges
// @route   GET /api/badges/:userId
// @access  Private
exports.getUserBadges = asyncHandler(async (req, res, next) => {
  // Users can only view their own badges, unless admin
  if (req.params.userId !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('You are not authorized to view these badges', 403));
  }

  const userBadges = await UserBadge.find({ userId: req.params.userId })
    .populate('badgeId')
    .sort({ earnedAt: -1 });

  // Transform data to match frontend expectations
  const transformedBadges = userBadges.map(ub => ({
    _id: ub._id,
    badge: ub.badgeId,
    earnedAt: ub.earnedAt
  }));

  res.status(200).json({
    success: true,
    data: transformedBadges
  });
});

// @desc    Award badge (system/admin)
// @route   POST /api/badges/award
// @access  Private (Admin)
exports.awardBadge = asyncHandler(async (req, res, next) => {
  const { userId, badgeId } = req.body;

  // Check if badge exists
  const badge = await Badge.findById(badgeId);
  if (!badge) {
    return next(new AppError('Badge not found', 404));
  }

  // Check if user already has this badge
  const existingUserBadge = await UserBadge.findOne({ userId, badgeId });
  if (existingUserBadge) {
    return next(new AppError('User already has this badge', 400));
  }

  const userBadge = await UserBadge.create({
    userId,
    badgeId
  });

  res.status(201).json({
    success: true,
    message: 'Badge awarded successfully',
    data: userBadge
  });
});

// @desc    Check and award automatic badges
// @route   POST /api/badges/check/:userId
// @access  Private
exports.checkAndAwardBadges = asyncHandler(async (req, res, next) => {
  // Users can only check their own badges
  if (req.params.userId !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('You are not authorized to perform this action', 403));
  }

  const userId = req.params.userId;
  const awardedBadges = [];

  // Get all badges
  const allBadges = await Badge.find();

  // Get user's existing badges
  const userBadges = await UserBadge.find({ userId }).select('badgeId');
  const userBadgeIds = userBadges.map(ub => ub.badgeId.toString());

  // Check each badge condition
  for (const badge of allBadges) {
    // Skip if user already has this badge
    if (userBadgeIds.includes(badge._id.toString())) {
      continue;
    }

    let shouldAward = false;

    // First course completed
    if (badge.condition.includes('first course completed')) {
      const completedCourses = await Enrollment.countDocuments({
        userId,
        completionPercentage: 100
      });
      if (completedCourses >= 1) shouldAward = true;
    }

    // 5 quizzes passed
    if (badge.condition.includes('5 quizzes passed')) {
      const passedQuizzes = await QuizAttempt.countDocuments({
        userId,
        passed: true
      });
      if (passedQuizzes >= 5) shouldAward = true;
    }

    // 7-day streak
    if (badge.condition.includes('7-day streak')) {
      const streak = await Streak.findOne({ userId });
      if (streak && streak.currentStreak >= 7) shouldAward = true;
    }

    // First discussion posted
    if (badge.condition.includes('first discussion posted')) {
      const discussions = await Discussion.countDocuments({ userId });
      if (discussions >= 1) shouldAward = true;
    }

    // Award badge if condition met
    if (shouldAward) {
      const userBadge = await UserBadge.create({
        userId,
        badgeId: badge._id
      });
      awardedBadges.push(badge);
    }
  }

  res.status(200).json({
    success: true,
    message: `${awardedBadges.length} new badge(s) awarded`,
    data: awardedBadges
  });
});
