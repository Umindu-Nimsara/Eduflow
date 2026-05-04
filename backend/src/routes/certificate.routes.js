const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect, restrictTo } = require('../middleware/auth.middleware');
const {
  getCertificatesByUser,
  generateCertificate,
  issueCertificate,
  getCertificatesByCourse,
  revokeCertificate
} = require('../controllers/certificate.controller');

const router = express.Router();

// Validation rules
const generateCertificateValidation = [
  body('courseId')
    .notEmpty().withMessage('Course ID is required')
    .isMongoId().withMessage('Invalid course ID')
];

const issueCertificateValidation = [
  body('userId')
    .notEmpty().withMessage('User ID is required')
    .isMongoId().withMessage('Invalid user ID'),
  body('courseId')
    .notEmpty().withMessage('Course ID is required')
    .isMongoId().withMessage('Invalid course ID')
];

// Routes
router.get('/my-certificates', protect, async (req, res, next) => {
  req.params.userId = req.user.id;
  return getCertificatesByUser(req, res, next);
});
router.get('/course/:courseId', protect, restrictTo('instructor', 'admin'), getCertificatesByCourse);
router.get('/:userId', protect, getCertificatesByUser);
router.post('/generate', protect, generateCertificateValidation, validate, generateCertificate);
router.post('/issue', protect, restrictTo('instructor', 'admin'), issueCertificateValidation, validate, issueCertificate);
router.delete('/:id', protect, restrictTo('instructor', 'admin'), revokeCertificate);

module.exports = router;
