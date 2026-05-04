const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const Progress = require('../models/Progress.model');
const Lesson = require('../models/Lesson.model');
const Enrollment = require('../models/Enrollment.model');
const Streak = require('../models/Streak.model');

// @desc    Get progress for user and course
// @route   GET /api/progress/:userId/:courseId
// @access  Private
exports.getProgress = asyncHandler(async (req, res, next) => {
  const { userId, courseId } = req.params;

  // Users can only view their own progress, unless admin
  if (userId !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('You are not authorized to view this progress', 403));
  }

  const progress = await Progress.find({ userId, courseId })
    .populate('lessonId', 'title duration orderIndex');

  res.status(200).json({
    success: true,
    data: progress
  });
});

// @desc    Update lesson progress
// @route   POST /api/progress/update
// @access  Private
exports.updateProgress = asyncHandler(async (req, res, next) => {
  const { courseId, lessonId, completed, watchedDuration } = req.body;

  // Find or create progress record
  let progress = await Progress.findOne({
    userId: req.user.id,
    courseId,
    lessonId
  });

  if (progress) {
    progress.completed = completed !== undefined ? completed : progress.completed;
    progress.watchedDuration = watchedDuration !== undefined ? watchedDuration : progress.watchedDuration;
    progress.lastWatchedAt = new Date();
    await progress.save();
  } else {
    progress = await Progress.create({
      userId: req.user.id,
      courseId,
      lessonId,
      completed: completed || false,
      watchedDuration: watchedDuration || 0
    });
  }

  // Calculate course completion percentage
  const totalLessons = await Lesson.countDocuments({ courseId });
  const completedLessons = await Progress.countDocuments({
    userId: req.user.id,
    courseId,
    completed: true
  });

  const completionPercentage = totalLessons > 0 
    ? Math.round((completedLessons / totalLessons) * 100) 
    : 0;

  // Update enrollment
  await Enrollment.findOneAndUpdate(
    { userId: req.user.id, courseId },
    { 
      completionPercentage,
      lastAccessedAt: new Date()
    }
  );

  // Update streak when lesson is completed
  if (completed) {
    await updateUserStreak(req.user.id);
  }

  res.status(200).json({
    success: true,
    message: 'Progress updated successfully',
    data: {
      progress,
      completionPercentage
    }
  });
});

// Helper function to update user streak
const updateUserStreak = async (userId) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let streak = await Streak.findOne({ userId });

    if (!streak) {
      // Create new streak
      streak = await Streak.create({
        userId,
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
        // Same day, no change to streak count but update activity time
        streak.lastActivityDate = new Date();
        // If streak is 0, set it to 1 (first activity)
        if (streak.currentStreak === 0) {
          streak.currentStreak = 1;
          streak.longestStreak = 1;
          streak.totalActiveDays = 1;
        }
      } else if (daysDiff === 1) {
        // Consecutive day - increase streak
        streak.currentStreak += 1;
        streak.totalActiveDays += 1;
        if (streak.currentStreak > streak.longestStreak) {
          streak.longestStreak = streak.currentStreak;
        }
        streak.lastActivityDate = new Date();
      } else if (daysDiff > 1) {
        // Streak broken - reset to 1
        streak.currentStreak = 1;
        streak.totalActiveDays += 1;
        streak.lastActivityDate = new Date();
      }

      await streak.save();
    }

    console.log(`Streak updated for user ${userId}: ${streak.currentStreak} days`);
  } catch (error) {
    console.error('Error updating streak:', error);
    // Don't throw error - streak update shouldn't break progress update
  }
};
