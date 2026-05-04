const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect, restrictTo } = require('../middleware/auth.middleware');
const {
  getQuizzesByCourse,
  getQuizById,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  submitQuiz,
  getQuizAttempts
} = require('../controllers/quiz.controller');

const router = express.Router();

// Validation rules
const quizValidation = [
  body('courseId')
    .notEmpty().withMessage('Course ID is required')
    .isMongoId().withMessage('Invalid course ID'),
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ max: 100 }).withMessage('Title cannot exceed 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
  body('passingScore')
    .notEmpty().withMessage('Passing score is required')
    .isFloat({ min: 0, max: 100 }).withMessage('Passing score must be between 0 and 100'),
  body('timeLimit')
    .notEmpty().withMessage('Time limit is required')
    .isInt({ min: 1 }).withMessage('Time limit must be at least 1 minute'),
  body('totalMarks')
    .notEmpty().withMessage('Total marks is required')
    .isFloat({ min: 0 }).withMessage('Total marks must be positive')
];

const submitQuizValidation = [
  body('answers')
    .isArray({ min: 1 }).withMessage('Answers array is required'),
  body('timeTaken')
    .notEmpty().withMessage('Time taken is required')
    .isInt({ min: 0 }).withMessage('Time taken must be positive')
];

// Routes
router.get('/my-attempts', protect, async (req, res, next) => {
  req.params.userId = req.user.id;
  return getQuizAttempts(req, res, next);
});
router.get('/', protect, getQuizzesByCourse); // GET /quizzes or /quizzes?courseId=xxx
router.get('/:id', protect, getQuizById);
router.get('/:id/questions', protect, async (req, res, next) => {
  // Get questions for a quiz
  const Question = require('../models/Question.model');
  const questions = await Question.find({ quizId: req.params.id });
  res.status(200).json({ success: true, data: questions });
});
router.post('/', protect, restrictTo('instructor', 'admin'), quizValidation, validate, createQuiz);
router.put('/:id', protect, restrictTo('instructor', 'admin'), updateQuiz);
router.delete('/:id', protect, restrictTo('instructor', 'admin'), deleteQuiz);
router.post('/:id/attempt', protect, submitQuizValidation, validate, submitQuiz);
router.get('/:id/attempts', protect, getQuizAttempts);

module.exports = router;
