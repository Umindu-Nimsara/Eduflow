const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const Report = require('../models/Report.model');
const AdminLog = require('../models/AdminLog.model');

// @desc    Create report
// @route   POST /api/reports
// @access  Private
exports.createReport = asyncHandler(async (req, res, next) => {
  const { targetId, targetModel, reason } = req.body;

  const report = await Report.create({
    reportedBy: req.user.id,
    targetId,
    targetModel,
    reason,
    status: 'pending'
  });

  res.status(201).json({
    success: true,
    message: 'Report submitted successfully',
    data: report
  });
});

// @desc    Get all reports
// @route   GET /api/reports
// @access  Private (Admin)
exports.getAllReports = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;
  const status = req.query.status || 'pending';

  const query = status === 'all' ? {} : { status };

  const reports = await Report.find(query)
    .populate('reportedBy', 'name email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Report.countDocuments(query);

  res.status(200).json({
    success: true,
    data: reports,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      total,
      limit
    }
  });
});

// @desc    Resolve report
// @route   PUT /api/reports/:id/resolve
// @access  Private (Admin)
exports.resolveReport = asyncHandler(async (req, res, next) => {
  const { status } = req.body;

  if (!['reviewed', 'resolved', 'dismissed'].includes(status)) {
    return next(new AppError('Invalid status', 400));
  }

  const report = await Report.findById(req.params.id);

  if (!report) {
    return next(new AppError('Report not found', 404));
  }

  report.status = status;
  await report.save();

  // Log admin action
  await AdminLog.create({
    adminId: req.user.id,
    action: `${status} report`,
    targetId: req.params.id,
    targetModel: 'Report'
  });

  res.status(200).json({
    success: true,
    message: `Report ${status} successfully`,
    data: report
  });
});
