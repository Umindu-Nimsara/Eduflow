const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth.middleware');
const {
  register,
  login,
  logout,
  refreshToken,
  getMe,
  changePassword,
  updateProfile,
  uploadProfilePhoto,
  forgotPassword,
  getResetToken,
  resetPassword,
  enable2FA,
  disable2FA
} = require('../controllers/auth.controller');

const router = express.Router();

// Validation rules
const registerValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ max: 50 }).withMessage('Name cannot exceed 50 characters'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('mobile')
    .optional()
    .matches(/^[0-9]{10,15}$/).withMessage('Please provide a valid mobile number (10-15 digits)'),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role')
    .optional()
    .isIn(['student', 'instructor', 'admin']).withMessage('Invalid role')
];

const loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required')
];

const refreshTokenValidation = [
  body('refreshToken')
    .notEmpty().withMessage('Refresh token is required')
];

const changePasswordValidation = [
  body('currentPassword')
    .notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .notEmpty().withMessage('New password is required')
    .isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  body('confirmPassword')
    .notEmpty().withMessage('Confirm password is required')
];

const updateProfileValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Name cannot exceed 50 characters'),
  body('mobile')
    .optional()
    .matches(/^[0-9]{10,15}$/).withMessage('Please provide a valid mobile number (10-15 digits)')
];

const forgotPasswordValidation = [
  body('identifier')
    .trim()
    .notEmpty().withMessage('Email address or mobile number is required')
    .custom((value) => {
      // Check if it's email or mobile
      if (value.includes('@')) {
        // Validate as email
        const emailRegex = /^\S+@\S+\.\S+$/;
        if (!emailRegex.test(value)) {
          throw new Error('Please provide a valid email address');
        }
      } else {
        // Validate as mobile
        const cleanMobile = value.replace(/\D/g, '');
        if (cleanMobile.length < 10 || cleanMobile.length > 15) {
          throw new Error('Please provide a valid mobile number (10-15 digits)');
        }
      }
      return true;
    })
];

const resetPasswordValidation = [
  body('newPassword')
    .notEmpty().withMessage('New password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('confirmPassword')
    .notEmpty().withMessage('Confirm password is required')
];

const uploadPhotoValidation = [
  body('photoUrl')
    .notEmpty().withMessage('Photo URL is required')
    .trim()
    // Allow both full URLs and relative paths (for local storage)
    .custom((value) => {
      if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('/')) {
        return true;
      }
      throw new Error('Please provide a valid photo URL or path');
    })
];

// Routes
router.post('/register', registerValidation, validate, register);
router.post('/login', loginValidation, validate, login);
router.post('/logout', protect, logout);
router.post('/refresh-token', refreshTokenValidation, validate, refreshToken);
router.get('/me', protect, getMe);

// Password management
router.put('/change-password', protect, changePasswordValidation, validate, changePassword);
router.put('/update-profile', protect, updateProfileValidation, validate, updateProfile);
router.put('/upload-photo', protect, uploadPhotoValidation, validate, uploadProfilePhoto);
router.post('/forgot-password', forgotPasswordValidation, validate, forgotPassword);
router.post('/get-reset-token', forgotPasswordValidation, validate, getResetToken);
router.post('/reset-password/:token', resetPasswordValidation, validate, resetPassword);

// Two-Factor Authentication (Admin only)
router.post('/enable-2fa', protect, enable2FA);
router.post('/disable-2fa', protect, disable2FA);

module.exports = router;
