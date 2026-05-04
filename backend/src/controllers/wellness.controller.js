const WellnessCheck = require('../models/WellnessCheck.model');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

exports.createWellnessCheck = asyncHandler(async (req, res, next) => {
  const wellnessCheck = await WellnessCheck.create({
    ...req.body,
    userId: req.user._id
  });

  res.status(201).json({
    success: true,
    data: wellnessCheck
  });
});

exports.getMyWellnessChecks = asyncHandler(async (req, res, next) => {
  const { startDate, endDate, limit = 30 } = req.query;

  const query = { userId: req.user._id };

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const checks = await WellnessCheck.find(query)
    .sort({ createdAt: -1 })
    .limit(parseInt(limit));

  res.status(200).json({
    success: true,
    count: checks.length,
    data: checks
  });
});

exports.getWellnessStats = asyncHandler(async (req, res, next) => {
  const checks = await WellnessCheck.find({ userId: req.user._id })
    .sort({ createdAt: -1 })
    .limit(30);

  if (checks.length === 0) {
    return res.status(200).json({
      success: true,
      data: {
        averageStress: 0,
        averageSleep: 0,
        averageStudy: 0,
        moodDistribution: {},
        totalChecks: 0
      }
    });
  }

  const stats = {
    averageStress: checks.reduce((sum, c) => sum + c.stressLevel, 0) / checks.length,
    averageSleep: checks.reduce((sum, c) => sum + (c.sleepHours || 0), 0) / checks.length,
    averageStudy: checks.reduce((sum, c) => sum + (c.studyHours || 0), 0) / checks.length,
    moodDistribution: {},
    totalChecks: checks.length,
    needsSupportCount: checks.filter(c => c.needsSupport).length
  };

  checks.forEach(check => {
    stats.moodDistribution[check.mood] = (stats.moodDistribution[check.mood] || 0) + 1;
  });

  res.status(200).json({
    success: true,
    data: stats
  });
});

exports.getStudentWellness = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;

  const checks = await WellnessCheck.find({ userId })
    .sort({ createdAt: -1 })
    .limit(30);

  const stats = {
    averageStress: checks.reduce((sum, c) => sum + c.stressLevel, 0) / (checks.length || 1),
    recentChecks: checks.slice(0, 5),
    needsSupport: checks.some(c => c.needsSupport && !c.supportProvided)
  };

  res.status(200).json({
    success: true,
    data: stats
  });
});

exports.provideSupport = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { supportNotes } = req.body;

  const check = await WellnessCheck.findByIdAndUpdate(
    id,
    {
      supportProvided: true,
      supportNotes
    },
    { new: true }
  );

  if (!check) {
    return next(new AppError('Wellness check not found', 404));
  }

  res.status(200).json({
    success: true,
    data: check
  });
});
