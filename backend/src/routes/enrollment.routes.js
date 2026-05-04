const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth.middleware');
const {
  getEnrollmentsByUser,
  enrollCourse,
  unenrollCourse
} = require('../controllers/enrollment.controller');

const router = express.Router();

// Validation rules
const enrollValidation = [
  body('courseId')
    .notEmpty().withMessage('Course ID is required')
    .isMongoId().withMessage('Invalid course ID')
];

// Routes
router.get('/my-enrollments', protect, async (req, res, next) => {
  req.params.userId = req.user.id;
  return getEnrollmentsByUser(req, res, next);
});
// Support query parameter for courseId (for instructors to see enrolled students)
router.get('/', protect, getEnrollmentsByUser);
router.get('/:userId', protect, getEnrollmentsByUser);
router.post('/enroll', protect, enrollValidation, validate, enrollCourse);
router.delete('/:id', protect, unenrollCourse);

module.exports = router;
