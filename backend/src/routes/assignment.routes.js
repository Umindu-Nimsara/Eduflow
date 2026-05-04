const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect, restrictTo } = require('../middleware/auth.middleware');
const { uploadDocument } = require('../config/cloudinary');
const {
  getAssignmentsByCourse,
  getAssignmentById,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  uploadAttachment
} = require('../controllers/assignment.controller');

const router = express.Router();

// Validation rules
const assignmentValidation = [
  body('courseId')
    .notEmpty().withMessage('Course ID is required')
    .isMongoId().withMessage('Invalid course ID'),
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ max: 100 }).withMessage('Title cannot exceed 100 characters'),
  body('description')
    .trim()
    .notEmpty().withMessage('Description is required')
    .isLength({ max: 2000 }).withMessage('Description cannot exceed 2000 characters'),
  body('dueDate')
    .notEmpty().withMessage('Due date is required')
    .isISO8601().withMessage('Invalid date format'),
  body('totalMarks')
    .notEmpty().withMessage('Total marks is required')
    .isFloat({ min: 0 }).withMessage('Total marks must be positive')
];

// Routes
router.get('/', protect, getAssignmentsByCourse);
router.get('/:id', protect, getAssignmentById);
router.post('/', protect, restrictTo('instructor', 'admin'), assignmentValidation, validate, createAssignment);
router.put('/:id', protect, restrictTo('instructor', 'admin'), updateAssignment);
router.delete('/:id', protect, restrictTo('instructor', 'admin'), deleteAssignment);
router.post('/upload', protect, restrictTo('instructor', 'admin'), uploadDocument.single('attachment'), uploadAttachment);

module.exports = router;
