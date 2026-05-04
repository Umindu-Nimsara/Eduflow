const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect, restrictTo } = require('../middleware/auth.middleware');
const {
  createReport,
  getAllReports,
  resolveReport
} = require('../controllers/report.controller');

const router = express.Router();

// Validation rules
const reportValidation = [
  body('targetId')
    .notEmpty().withMessage('Target ID is required')
    .isMongoId().withMessage('Invalid target ID'),
  body('targetModel')
    .notEmpty().withMessage('Target model is required')
    .isIn(['Discussion', 'Reply', 'Feedback', 'User']).withMessage('Invalid target model'),
  body('reason')
    .trim()
    .notEmpty().withMessage('Reason is required')
    .isLength({ max: 500 }).withMessage('Reason cannot exceed 500 characters')
];

const resolveValidation = [
  body('status')
    .notEmpty().withMessage('Status is required')
    .isIn(['reviewed', 'resolved', 'dismissed']).withMessage('Invalid status')
];

// Routes
router.get('/my-reports', protect, async (req, res, next) => {
  const reports = await require('../models/Report.model').find({ reporterId: req.user.id })
    .populate('targetId')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: reports
  });
});
router.post('/', protect, reportValidation, validate, createReport);
router.get('/', protect, restrictTo('admin'), getAllReports);
router.put('/:id/resolve', protect, restrictTo('admin'), resolveValidation, validate, resolveReport);

module.exports = router;
