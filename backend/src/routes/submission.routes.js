const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect, restrictTo } = require('../middleware/auth.middleware');
const { uploadDocument } = require('../config/cloudinary');
const AppError = require('../utils/AppError');
const {
  submitAssignment,
  gradeSubmission,
  getSubmissionsByAssignment,
  getUserSubmissions,
  uploadSubmission
} = require('../controllers/submission.controller');

const router = express.Router();

// Validation rules
const submitValidation = [
  body('submissionUrl')
    .trim()
    .notEmpty().withMessage('Submission URL is required')
];

const gradeValidation = [
  body('grade')
    .notEmpty().withMessage('Grade is required')
    .isFloat({ min: 0 }).withMessage('Grade must be positive'),
  body('feedback')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Feedback cannot exceed 1000 characters')
];

// Routes
router.post('/', protect, uploadDocument.single('file'), async (req, res, next) => {
  // Handle assignment submission with optional file
  const { assignmentId, submissionText } = req.body;
  if (!assignmentId) {
    return next(new AppError('Assignment ID is required', 400));
  }
  return submitAssignment(req, res, next);
});
router.get('/my-submissions', protect, async (req, res, next) => {
  req.params.userId = req.user.id;
  return getUserSubmissions(req, res, next);
});
router.get('/assignment/:assignmentId', protect, getSubmissionsByAssignment);
router.get('/:id', protect, async (req, res, next) => {
  // Get single submission by ID
  const submission = await require('../models/AssignmentSubmission.model').findById(req.params.id)
    .populate('assignmentId', 'title courseId dueDate totalMarks')
    .populate('userId', 'name email');
  
  if (!submission) {
    return next(new AppError('Submission not found', 404));
  }

  const userId = req.user._id || req.user.id;

  // Check if user can view this submission
  if (submission.userId._id.toString() !== userId.toString() && req.user.role !== 'admin') {
    return next(new AppError('You are not authorized to view this submission', 403));
  }

  res.status(200).json({
    success: true,
    data: submission
  });
});
router.post('/upload', protect, uploadDocument.single('submission'), uploadSubmission);
router.put('/:id/grade', protect, restrictTo('instructor', 'admin'), gradeValidation, validate, gradeSubmission);
router.get('/user/:userId', protect, getUserSubmissions);

module.exports = router;
