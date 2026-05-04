const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const Streak = require('../models/Streak.model');

// @desc    Get streak by user
// @route   GET /api/streaks/:userId
// @access  Private
exports.getStreakByUser = asyncHandler(async (req, res, next) => {
  // Users can only view their own streak, unless admin
  if (req.params.userId !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('You are not authorized to view this streak', 403));
  }

  let streak = await Streak.findOne({ userId: req.params.userId });

  if (!streak) {
    // Create streak if doesn't exist
    streak = await Streak.create({
      userId: req.params.userId
    });
  }

  res.status(200).json({
    success: true,
    data: streak
  });
});

// @desc    Update streak (manual activity tracking)
// @route   POST /api/streaks/update
// @access  Private
exports.updateStreak = asyncHandler(async (req, res, next) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let streak = await Streak.findOne({ userId: req.user.id });

  if (!streak) {
    streak = await Streak.create({
      userId: req.user.id,
      currentStreak: 1,
      longestStreak: 1,
      lastActivityDate: new Date(),
      totalActiveDays: 1
    });
  } else {
    const lastActivity = new Date(streak.lastActivityDate);
    lastActivity.setHours(0, 0, 0, 0);

    const daysDiff = Math.floor((today - lastActivity) / (1000 * 60 * 60 * 24));

    if (daysDiff === 0) {
      // Same day, no change
    } else if (daysDiff === 1) {
      // Consecutive day
      streak.currentStreak += 1;
      streak.totalActiveDays += 1;
      if (streak.currentStreak > streak.longestStreak) {
        streak.longestStreak = streak.currentStreak;
      }
      streak.lastActivityDate = new Date();
    } else if (daysDiff > 1) {
      // Streak broken
      streak.currentStreak = 1;
      streak.totalActiveDays += 1;
      streak.lastActivityDate = new Date();
    }

    await streak.save();
  }

  res.status(200).json({
    success: true,
    message: 'Streak updated successfully',
    data: streak
  });
});
