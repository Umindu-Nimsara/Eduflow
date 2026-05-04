const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const UserGamification = require('../models/Gamification.model');
const { createNotification, NOTIFICATION_TYPES } = require('../utils/notificationHelper');

// Points for different actions
const POINTS = {
  LESSON_COMPLETE: 10,
  QUIZ_COMPLETE: 20,
  QUIZ_PERFECT: 50,
  ASSIGNMENT_SUBMIT: 30,
  DISCUSSION_CREATE: 15,
  REPLY_POST: 5,
  COURSE_COMPLETE: 100,
  DAILY_LOGIN: 5,
  STREAK_BONUS: 10
};

// Badge definitions
const BADGES = {
  FIRST_LESSON: {
    id: 'first_lesson',
    name: 'First Steps',
    description: 'Complete your first lesson',
    icon: 'school-outline'
  },
  QUIZ_MASTER: {
    id: 'quiz_master',
    name: 'Quiz Master',
    description: 'Complete 10 quizzes',
    icon: 'trophy-outline'
  },
  PERFECT_SCORE: {
    id: 'perfect_score',
    name: 'Perfect Score',
    description: 'Get 100% on a quiz',
    icon: 'star-outline'
  },
  DISCUSSION_STARTER: {
    id: 'discussion_starter',
    name: 'Discussion Starter',
    description: 'Create 5 discussions',
    icon: 'chatbubbles-outline'
  },
  COURSE_CHAMPION: {
    id: 'course_champion',
    name: 'Course Champion',
    description: 'Complete your first course',
    icon: 'ribbon-outline'
  },
  WEEK_WARRIOR: {
    id: 'week_warrior',
    name: 'Week Warrior',
    description: 'Maintain a 7-day streak',
    icon: 'flame-outline'
  }
};

// @desc    Get user gamification data
// @route   GET /api/gamification/me
// @access  Private
exports.getMyGamification = asyncHandler(async (req, res, next) => {
  let gamification = await UserGamification.findOne({ userId: req.user.id });

  if (!gamification) {
    // Create new gamification profile
    try {
      gamification = await UserGamification.create({
        userId: req.user.id
      });
    } catch (error) {
      // If duplicate key error, try to find again (race condition)
      if (error.code === 11000) {
        gamification = await UserGamification.findOne({ userId: req.user.id });
        if (!gamification) {
          return next(new AppError('Failed to create gamification profile', 500));
        }
      } else {
        throw error;
      }
    }
  }

  res.status(200).json({
    success: true,
    data: gamification
  });
});

// @desc    Award points for action
// @route   POST /api/gamification/award-points
// @access  Private
exports.awardPoints = asyncHandler(async (req, res, next) => {
  const { action, metadata } = req.body;

  let gamification = await UserGamification.findOne({ userId: req.user.id });

  if (!gamification) {
    try {
      gamification = await UserGamification.create({ userId: req.user.id });
    } catch (error) {
      if (error.code === 11000) {
        gamification = await UserGamification.findOne({ userId: req.user.id });
        if (!gamification) {
          return next(new AppError('Failed to create gamification profile', 500));
        }
      } else {
        throw error;
      }
    }
  }

  const oldLevel = gamification.level;
  let points = 0;

  // Award points based on action
  switch (action) {
    case 'LESSON_COMPLETE':
      points = POINTS.LESSON_COMPLETE;
      gamification.stats.lessonsCompleted += 1;
      await checkBadge(gamification, 'FIRST_LESSON', req.user.id);
      break;

    case 'QUIZ_COMPLETE':
      points = POINTS.QUIZ_COMPLETE;
      gamification.stats.quizzesCompleted += 1;
      
      // Bonus for perfect score
      if (metadata?.score === 100) {
        points += POINTS.QUIZ_PERFECT;
        gamification.stats.perfectQuizzes += 1;
        await checkBadge(gamification, 'PERFECT_SCORE', req.user.id);
      }
      
      if (gamification.stats.quizzesCompleted >= 10) {
        await checkBadge(gamification, 'QUIZ_MASTER', req.user.id);
      }
      break;

    case 'ASSIGNMENT_SUBMIT':
      points = POINTS.ASSIGNMENT_SUBMIT;
      gamification.stats.assignmentsSubmitted += 1;
      break;

    case 'DISCUSSION_CREATE':
      points = POINTS.DISCUSSION_CREATE;
      gamification.stats.discussionsCreated += 1;
      
      if (gamification.stats.discussionsCreated >= 5) {
        await checkBadge(gamification, 'DISCUSSION_STARTER', req.user.id);
      }
      break;

    case 'REPLY_POST':
      points = POINTS.REPLY_POST;
      gamification.stats.repliesPosted += 1;
      break;

    case 'COURSE_COMPLETE':
      points = POINTS.COURSE_COMPLETE;
      gamification.stats.coursesCompleted += 1;
      await checkBadge(gamification, 'COURSE_CHAMPION', req.user.id);
      break;

    case 'DAILY_LOGIN':
      points = POINTS.DAILY_LOGIN;
      gamification.stats.daysActive += 1;
      break;

    default:
      return next(new AppError('Invalid action', 400));
  }

  // Add points
  gamification.addPoints(points);
  gamification.trackActivity();
  gamification.lastActivityDate = Date.now();
  await gamification.save();

  // Check if leveled up
  const leveledUp = gamification.level > oldLevel;
  if (leveledUp) {
    await createNotification(
      req.user.id,
      'Level Up! 🎉',
      `Congratulations! You've reached Level ${gamification.level}`,
      NOTIFICATION_TYPES.ACHIEVEMENT,
      gamification._id,
      'UserGamification'
    );
  }

  res.status(200).json({
    success: true,
    data: {
      points: points,
      totalPoints: gamification.totalPoints,
      level: gamification.level,
      leveledUp: leveledUp,
      newBadges: []
    }
  });
});

// Helper function to check and award badges
async function checkBadge(gamification, badgeKey, userId) {
  const badge = BADGES[badgeKey];
  
  // Check if already has badge
  const hasBadge = gamification.badges.some(b => b.badgeId === badge.id);
  
  if (!hasBadge) {
    gamification.badges.push({
      badgeId: badge.id,
      name: badge.name,
      description: badge.description,
      icon: badge.icon
    });

    // Send notification
    await createNotification(
      userId,
      'New Badge Earned! 🏆',
      `You've earned the "${badge.name}" badge!`,
      NOTIFICATION_TYPES.ACHIEVEMENT,
      gamification._id,
      'UserGamification'
    );
  }
}

// @desc    Get leaderboard
// @route   GET /api/gamification/leaderboard
// @access  Public
exports.getLeaderboard = asyncHandler(async (req, res, next) => {
  const { timeframe = 'all', limit = 10 } = req.query;

  let query = {};

  // Filter by timeframe
  if (timeframe === 'week') {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    query.lastActivityDate = { $gte: weekAgo };
  } else if (timeframe === 'month') {
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    query.lastActivityDate = { $gte: monthAgo };
  }

  const leaderboard = await UserGamification.find(query)
    .sort({ totalPoints: -1 })
    .limit(parseInt(limit))
    .populate('userId', 'name email');

  res.status(200).json({
    success: true,
    data: leaderboard
  });
});

// @desc    Get daily challenges
// @route   GET /api/gamification/daily-challenges
// @access  Private
exports.getDailyChallenges = asyncHandler(async (req, res, next) => {
  let gamification = await UserGamification.findOne({ userId: req.user.id });

  if (!gamification) {
    try {
      gamification = await UserGamification.create({ userId: req.user.id });
    } catch (error) {
      // If duplicate key error, try to find again (race condition)
      if (error.code === 11000) {
        gamification = await UserGamification.findOne({ userId: req.user.id });
        if (!gamification) {
          return next(new AppError('Failed to create gamification profile', 500));
        }
      } else {
        throw error;
      }
    }
  }

  // Check if need to generate new challenges
  const today = new Date().toDateString();
  const lastChallengeDate = gamification.dailyChallenges[0]?.date 
    ? new Date(gamification.dailyChallenges[0].date).toDateString()
    : null;

  if (lastChallengeDate !== today) {
    // Generate new daily challenges
    gamification.dailyChallenges = generateDailyChallenges();
    await gamification.save();
  }

  res.status(200).json({
    success: true,
    data: gamification.dailyChallenges
  });
});

// Generate daily challenges
function generateDailyChallenges() {
  const challenges = [
    {
      challengeId: 'daily_lesson',
      name: 'Complete 3 Lessons',
      description: 'Watch and complete 3 lessons today',
      target: 3,
      progress: 0,
      points: 30,
      completed: false,
      date: new Date()
    },
    {
      challengeId: 'daily_quiz',
      name: 'Take a Quiz',
      description: 'Complete at least one quiz today',
      target: 1,
      progress: 0,
      points: 20,
      completed: false,
      date: new Date()
    },
    {
      challengeId: 'daily_discussion',
      name: 'Join Discussion',
      description: 'Post a reply in any discussion',
      target: 1,
      progress: 0,
      points: 15,
      completed: false,
      date: new Date()
    }
  ];

  return challenges;
}

// @desc    Update challenge progress
// @route   PUT /api/gamification/challenge/:challengeId
// @access  Private
exports.updateChallengeProgress = asyncHandler(async (req, res, next) => {
  const { challengeId } = req.params;
  const { progress } = req.body;

  const gamification = await UserGamification.findOne({ userId: req.user.id });

  if (!gamification) {
    return next(new AppError('Gamification profile not found', 404));
  }

  const challenge = gamification.dailyChallenges.find(
    c => c.challengeId === challengeId
  );

  if (!challenge) {
    return next(new AppError('Challenge not found', 404));
  }

  challenge.progress = progress;

  // Check if completed
  if (challenge.progress >= challenge.target && !challenge.completed) {
    challenge.completed = true;
    gamification.addPoints(challenge.points);

    await createNotification(
      req.user.id,
      'Challenge Complete! 🎯',
      `You've completed "${challenge.name}" and earned ${challenge.points} points!`,
      NOTIFICATION_TYPES.ACHIEVEMENT,
      gamification._id,
      'UserGamification'
    );
  }

  await gamification.save();

  res.status(200).json({
    success: true,
    data: challenge
  });
});

// @desc    Get all badges
// @route   GET /api/gamification/badges
// @access  Public
exports.getAllBadges = asyncHandler(async (req, res, next) => {
  const allBadges = Object.values(BADGES);

  res.status(200).json({
    success: true,
    data: allBadges
  });
});

module.exports = {
  getMyGamification: exports.getMyGamification,
  awardPoints: exports.awardPoints,
  getLeaderboard: exports.getLeaderboard,
  getDailyChallenges: exports.getDailyChallenges,
  updateChallengeProgress: exports.updateChallengeProgress,
  getAllBadges: exports.getAllBadges,
  POINTS,
  BADGES
};
