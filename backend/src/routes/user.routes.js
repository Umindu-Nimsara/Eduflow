const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect, restrictTo } = require('../middleware/auth.middleware');
const { uploadImage } = require('../config/cloudinary');
const {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  uploadPhoto
} = require('../controllers/user.controller');

const router = express.Router();

// Validation rules
const updateUserValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Name cannot exceed 50 characters'),
  body('phone')
    .optional()
    .trim(),
  body('address')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Address cannot exceed 200 characters'),
  body('dateOfBirth')
    .optional()
    .isISO8601().withMessage('Invalid date format')
];

// Routes
router.get('/', protect, restrictTo('admin'), getAllUsers);
router.get('/:id', protect, getUserById);
router.put('/:id', protect, updateUserValidation, validate, updateUser);
router.delete('/:id', protect, restrictTo('admin'), deleteUser);
router.post('/upload-photo', protect, uploadImage.single('photo'), uploadPhoto);

module.exports = router;
