const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect, restrictTo } = require('../middleware/auth.middleware');
const { uploadImage } = require('../config/cloudinary');
const {
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  uploadThumbnail,
  getCoursesByInstructor,
  testThumbnail
} = require('../controllers/course.controller');
const { getLessonsByCourse } = require('../controllers/lesson.controller');

const router = express.Router();

// Validation rules
const courseValidation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ max: 100 }).withMessage('Title cannot exceed 100 characters'),
  body('description')
    .trim()
    .notEmpty().withMessage('Description is required')
    .isLength({ max: 2000 }).withMessage('Description cannot exceed 2000 characters'),
  body('category')
    .trim()
    .notEmpty().withMessage('Category is required'),
  body('price')
    .notEmpty().withMessage('Price is required')
    .isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('thumbnail')
    .optional(),
  body('isPublished')
    .optional()
];

const updateCourseValidation = [
  body('title')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Title cannot exceed 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage('Description cannot exceed 2000 characters'),
  body('category')
    .optional()
    .trim(),
  body('price')
    .optional()
    .isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('thumbnail')
    .optional()
    .isURL().withMessage('Thumbnail must be a valid URL'),
  body('isPublished')
    .optional()
    .isBoolean().withMessage('isPublished must be a boolean')
];

// Routes - specific routes BEFORE parameterized routes
router.get('/', getAllCourses);
router.get('/instructor/:instructorId', protect, getCoursesByInstructor);
router.post('/upload', protect, restrictTo('instructor', 'admin'), uploadImage.single('thumbnail'), uploadThumbnail);
router.post('/test-thumbnail', protect, restrictTo('instructor', 'admin'), testThumbnail);
router.post('/', protect, restrictTo('instructor', 'admin'), courseValidation, validate, createCourse);
router.put('/:id/publish', protect, restrictTo('instructor', 'admin'), updateCourse); // Publish/unpublish
router.put('/:id/deadline', protect, restrictTo('instructor', 'admin'), updateCourse); // Update deadline
router.get('/:id', getCourseById);
router.get('/:id/lessons', getLessonsByCourse);
router.put('/:id', protect, restrictTo('instructor', 'admin'), updateCourseValidation, validate, updateCourse);
router.delete('/:id', protect, restrictTo('instructor', 'admin'), deleteCourse);

module.exports = router;
