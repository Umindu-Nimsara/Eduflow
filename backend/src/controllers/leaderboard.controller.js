const Leaderboard = require('../models/Leaderboard.model');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

exports.getLeaderboard = asyncHandler(async (req, res, next) => {
  const { courseId } = req.params;
  const { limit = 50 } = req.query;

  const leaderboard = await Leaderboard.find({ courseId })
    .populate('userId', 'name email profilePicture')
    .sort({ points: -1 })
    .limit(parseInt(limit));

  // Update ranks
  leaderboard.forEach((entry, index) => {
    entry.rank = index + 1;
  });

  res.status(200).json({
    success: true,
    count: leaderboard.length,
    data: leaderboard
  });
});

exports.getUserStats = asyncHandler(async (req, res, next) => {
  const { courseId } = req.params;

  let stats = await Leaderboard.findOne({
    userId: req.user._id,
    courseId
  }).populate('achievements');

  if (!stats) {
    stats = await Leaderboard.create({
      userId: req.user._id,
      courseId,
      points: 0
    });
  }

  res.status(200).json({
    success: true,
    data: stats
  });
});

exports.addPoints = asyncHandler(async (req, res, next) => {
  const { userId, courseId, points, activity } = req.body;

  let leaderboard = await Leaderboard.findOne({ userId, courseId });

  if (!leaderboard) {
    leaderboard = await Leaderboard.create({
      userId,
      courseId,
      points: 0
    });
  }

  leaderboard.points += points;

  // Update activity stats
  if (activity === 'quiz') leaderboard.stats.quizzesCompleted += 1;
  if (activity === 'assignment') leaderboard.stats.assignmentsSubmitted += 1;
  if (activity === 'lesson') leaderboard.stats.lessonsCompleted += 1;
  if (activity === 'forum') leaderboard.stats.forumPosts += 1;

  // Update streak
  const today = new Date().setHours(0, 0, 0, 0);
  const lastActivity = leaderboard.streak.lastActivity 
    ? new Date(leaderboard.streak.lastActivity).setHours(0, 0, 0, 0)
    : null;

  if (!lastActivity || today - lastActivity === 86400000) {
    leaderboard.streak.current += 1;
    if (leaderboard.streak.current > leaderboard.streak.longest) {
      leaderboard.streak.longest = leaderboard.streak.current;
    }
  } else if (today - lastActivity > 86400000) {
    leaderboard.streak.current = 1;
  }

  leaderboard.streak.lastActivity = new Date();

  await leaderboard.save();

  res.status(200).json({
    success: true,
    data: leaderboard
  });
});

exports.getGlobalLeaderboard = asyncHandler(async (req, res, next) => {
  const { limit = 100 } = req.query;

  const leaderboard = await Leaderboard.aggregate([
    {
      $group: {
        _id: '$userId',
        totalPoints: { $sum: '$points' },
        coursesCount: { $sum: 1 }
      }
    },
    { $sort: { totalPoints: -1 } },
    { $limit: parseInt(limit) }
  ]);

  await Leaderboard.populate(leaderboard, {
    path: '_id',
    select: 'name email profilePicture'
  });

  res.status(200).json({
    success: true,
    count: leaderboard.length,
    data: leaderboard
  });
});
