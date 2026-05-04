const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect, restrictTo } = require('../middleware/auth.middleware');
const { uploadVideo, uploadDocument } = require('../config/cloudinary');
const {
  getLessonsByCourse,
  getLessonById,
  createLesson,
  updateLesson,
  deleteLesson,
  uploadVideo: uploadLessonVideo,
  uploadDocument: uploadLessonDocument
} = require('../controllers/lesson.controller');

const router = express.Router();

// Validation rules - videoUrl is now optional (can use file upload instead)
const lessonValidation = [
  body('courseId')
    .notEmpty().withMessage('Course ID is required')
    .isMongoId().withMessage('Invalid course ID'),
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ max: 100 }).withMessage('Title cannot exceed 100 characters'),
  body('videoUrl')
    .optional()
    .trim(),
  body('duration')
    .optional()
    .isInt({ min: 0 }).withMessage('Duration must be a positive number'),
  body('orderIndex')
    .optional()
    .isInt({ min: 0 }).withMessage('Order index must be a positive number'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters')
];

const updateLessonValidation = [
  body('title')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Title cannot exceed 100 characters'),
  body('videoUrl')
    .optional()
    .trim(),
  body('duration')
    .optional()
    .isInt({ min: 0 }).withMessage('Duration must be a positive number'),
  body('orderIndex')
    .optional()
    .isInt({ min: 0 }).withMessage('Order index must be a positive number'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters')
];

// Routes
router.get('/course/:courseId', getLessonsByCourse);
router.get('/:id', getLessonById);
router.post('/', protect, restrictTo('instructor', 'admin'), lessonValidation, validate, createLesson);
router.put('/:id', protect, restrictTo('instructor', 'admin'), updateLessonValidation, validate, updateLesson);
router.delete('/:id', protect, restrictTo('instructor', 'admin'), deleteLesson);
router.post('/upload-video', protect, restrictTo('instructor', 'admin'), uploadVideo.single('video'), uploadLessonVideo);
router.post('/upload-document', protect, restrictTo('instructor', 'admin'), uploadDocument.single('document'), uploadLessonDocument);

module.exports = router;
