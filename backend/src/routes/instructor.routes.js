const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect, restrictTo } = require('../middleware/auth.middleware');
const { uploadImage } = require('../config/cloudinary');
const {
  getAllInstructors,
  getInstructorById,
  registerInstructor,
  updateInstructor,
  deleteInstructor,
  uploadPhoto,
  verifyInstructor,
  getInstructorCourses,
  getInstructorStats,
  getMyProfile,
  updateMyProfile
} = require('../controllers/instructor.controller');

const router = express.Router();

// Validation rules
const registerInstructorValidation = [
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Bio cannot exceed 1000 characters'),
  body('expertise')
    .optional()
    .trim()
];

const updateInstructorValidation = [
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Bio cannot exceed 1000 characters'),
  body('expertise')
    .optional()
    .trim()
];

// Routes
router.get('/profile', protect, restrictTo('instructor', 'admin'), getMyProfile);
router.put('/profile', protect, restrictTo('instructor', 'admin'), updateMyProfile);
router.post('/upload-photo', protect, restrictTo('instructor', 'admin'), uploadImage.single('photo'), uploadPhoto);
router.get('/', getAllInstructors);
router.get('/:id/courses', getInstructorCourses);
router.get('/:id/stats', getInstructorStats);
router.get('/:id', getInstructorById);
router.post('/register', protect, registerInstructorValidation, validate, registerInstructor);
router.put('/:id', protect, updateInstructorValidation, validate, updateInstructor);
router.delete('/:id', protect, restrictTo('admin'), deleteInstructor);
router.put('/:id/verify', protect, restrictTo('admin'), verifyInstructor);

module.exports = router;
