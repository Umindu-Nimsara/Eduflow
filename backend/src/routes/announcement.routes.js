const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect, restrictTo } = require('../middleware/auth.middleware');
const {
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  getAllAnnouncements,
  getAnnouncementById
} = require('../controllers/announcement.controller');

const router = express.Router();

// Validation rules
const announcementValidation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ max: 100 }).withMessage('Title cannot exceed 100 characters'),
  body('content')
    .trim()
    .notEmpty().withMessage('Content is required')
    .isLength({ max: 2000 }).withMessage('Content cannot exceed 2000 characters'),
  body('targetRole')
    .optional()
    .isIn(['all', 'student', 'instructor']).withMessage('Invalid target role'),
  body('courseId')
    .optional()
    .isMongoId().withMessage('Invalid course ID')
];

// Routes
router.get('/admin/all', protect, restrictTo('admin'), getAllAnnouncements);
router.get('/', protect, getAnnouncements);
router.get('/:id', protect, getAnnouncementById);
router.post('/', protect, restrictTo('admin', 'instructor'), announcementValidation, validate, createAnnouncement);
router.put('/:id', protect, restrictTo('admin', 'instructor'), updateAnnouncement);
router.delete('/:id', protect, restrictTo('admin', 'instructor'), deleteAnnouncement);

module.exports = router;
