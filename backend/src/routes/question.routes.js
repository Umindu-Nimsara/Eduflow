const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect, restrictTo } = require('../middleware/auth.middleware');
const {
  getQuestionsByQuiz,
  getQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion
} = require('../controllers/question.controller');

const router = express.Router();

// Validation rules
const questionValidation = [
  body('quizId')
    .notEmpty().withMessage('Quiz ID is required')
    .isMongoId().withMessage('Invalid quiz ID'),
  body('questionText')
    .trim()
    .notEmpty().withMessage('Question text is required')
    .isLength({ max: 500 }).withMessage('Question text cannot exceed 500 characters'),
  body('options')
    .isArray({ min: 2 }).withMessage('At least 2 options are required'),
  body('correctAnswer')
    .notEmpty().withMessage('Correct answer is required')
    .isInt({ min: 0 }).withMessage('Correct answer must be a non-negative integer'),
  body('marks')
    .optional()
    .isFloat({ min: 0 }).withMessage('Marks must be positive')
];

// Routes
router.get('/', protect, getQuestionsByQuiz); // GET /questions?quizId=xxx
router.get('/:id', protect, getQuestionById);
router.post('/', protect, restrictTo('instructor', 'admin'), questionValidation, validate, createQuestion);
router.put('/:id', protect, restrictTo('instructor', 'admin'), updateQuestion);
router.delete('/:id', protect, restrictTo('instructor', 'admin'), deleteQuestion);

module.exports = router;
