const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect, restrictTo } = require('../middleware/auth.middleware');
const {
  createFeedback,
  getFeedbackByCourse,
  approveFeedback,
  deleteFeedback,
  updateFeedback,
  getPendingFeedback,
  replyToFeedback,
  getAllFeedback,
  voteHelpful
} = require('../controllers/feedback.controller');

const router = express.Router();

// Validation rules
const feedbackValidation = [
  body('courseId')
    .notEmpty().withMessage('Course ID is required')
    .isMongoId().withMessage('Invalid course ID'),
  body('rating')
    .notEmpty().withMessage('Rating is required')
    .isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Comment cannot exceed 1000 characters')
];

// Routes
router.get('/admin/all', protect, restrictTo('admin'), getAllFeedback);
router.get('/pending/all', protect, restrictTo('admin'), getPendingFeedback);
router.get('/course/:courseId', getFeedbackByCourse);
router.post('/', protect, feedbackValidation, validate, createFeedback);
router.put('/:id', protect, updateFeedback);
router.put('/:id/approve', protect, restrictTo('admin'), approveFeedback);
router.put('/:id/reply', protect, restrictTo('instructor', 'admin'), replyToFeedback);
router.post('/:id/vote', protect, voteHelpful);
router.delete('/:id', protect, deleteFeedback);

module.exports = router;
