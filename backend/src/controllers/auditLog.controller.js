const AuditLog = require('../models/AuditLog.model');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

exports.createAuditLog = async (data) => {
  try {
    await AuditLog.create(data);
  } catch (err) {
    console.error('Failed to create audit log:', err);
  }
};

exports.getAuditLogs = asyncHandler(async (req, res, next) => {
  const {
    userId,
    action,
    resourceType,
    startDate,
    endDate,
    limit = 100,
    page = 1
  } = req.query;

  const query = {};

  if (userId) query.userId = userId;
  if (action) query.action = action;
  if (resourceType) query.resourceType = resourceType;

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [logs, total] = await Promise.all([
    AuditLog.find(query)
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip),
    AuditLog.countDocuments(query)
  ]);

  res.status(200).json({
    success: true,
    count: logs.length,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / parseInt(limit)),
    data: logs
  });
});

exports.getMyAuditLogs = asyncHandler(async (req, res, next) => {
  const { limit = 50 } = req.query;

  const logs = await AuditLog.find({ userId: req.user._id })
    .sort({ createdAt: -1 })
    .limit(parseInt(limit));

  res.status(200).json({
    success: true,
    count: logs.length,
    data: logs
  });
});

exports.getResourceAuditLogs = asyncHandler(async (req, res, next) => {
  const { resourceType, resourceId } = req.params;

  const logs = await AuditLog.find({ resourceType, resourceId })
    .populate('userId', 'name email role')
    .sort({ createdAt: -1 })
    .limit(100);

  res.status(200).json({
    success: true,
    count: logs.length,
    data: logs
  });
});

exports.getAuditStats = asyncHandler(async (req, res, next) => {
  const { startDate, endDate } = req.query;

  const query = {};
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const [actionStats, resourceStats, userStats] = await Promise.all([
    AuditLog.aggregate([
      { $match: query },
      { $group: { _id: '$action', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]),
    AuditLog.aggregate([
      { $match: query },
      { $group: { _id: '$resourceType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]),
    AuditLog.aggregate([
      { $match: query },
      { $group: { _id: '$userId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ])
  ]);

  await AuditLog.populate(userStats, {
    path: '_id',
    select: 'name email'
  });

  res.status(200).json({
    success: true,
    data: {
      byAction: actionStats,
      byResource: resourceStats,
      topUsers: userStats
    }
  });
});

exports.deleteOldLogs = asyncHandler(async (req, res, next) => {
  const { days = 90 } = req.query;

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));

  const result = await AuditLog.deleteMany({
    createdAt: { $lt: cutoffDate }
  });

  res.status(200).json({
    success: true,
    message: `Deleted ${result.deletedCount} old audit logs`
  });
});
