const asyncHandler = require('../utils/asyncHandler');
const AdminLog = require('../models/AdminLog.model');

// @desc    Get admin logs
// @route   GET /api/admin/logs
// @access  Private (Admin)
exports.getAdminLogs = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const logs = await AdminLog.find()
    .populate('adminId', 'name email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await AdminLog.countDocuments();

  res.status(200).json({
    success: true,
    data: logs,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      total,
      limit
    }
  });
});
