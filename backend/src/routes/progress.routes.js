const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth.middleware');
const {
  getProgress,
  updateProgress
} = require('../controllers/progress.controller');

const router = express.Router();

// Validation rules
const updateProgressValidation = [
  body('courseId')
    .notEmpty().withMessage('Course ID is required')
    .isMongoId().withMessage('Invalid course ID'),
  body('lessonId')
    .notEmpty().withMessage('Lesson ID is required')
    .isMongoId().withMessage('Invalid lesson ID'),
  body('completed')
    .optional()
    .isBoolean().withMessage('Completed must be a boolean'),
  body('watchedDuration')
    .optional()
    .isInt({ min: 0 }).withMessage('Watched duration must be positive')
];

// Routes
router.get('/my-progress', protect, async (req, res, next) => {
  req.params.userId = req.user.id;
  req.params.courseId = req.query.courseId || req.params.courseId;
  return getProgress(req, res, next);
});
router.get('/course/:courseId', protect, async (req, res, next) => {
  req.params.userId = req.user.id;
  return getProgress(req, res, next);
});
router.get('/:userId/:courseId', protect, getProgress);
router.post('/update', protect, updateProgressValidation, validate, updateProgress);

module.exports = router;
