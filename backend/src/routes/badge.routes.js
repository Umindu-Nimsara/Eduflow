const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect, restrictTo } = require('../middleware/auth.middleware');
const {
  getAllBadges,
  getUserBadges,
  awardBadge,
  checkAndAwardBadges
} = require('../controllers/badge.controller');

const router = express.Router();

// Validation rules
const awardBadgeValidation = [
  body('userId')
    .notEmpty().withMessage('User ID is required')
    .isMongoId().withMessage('Invalid user ID'),
  body('badgeId')
    .notEmpty().withMessage('Badge ID is required')
    .isMongoId().withMessage('Invalid badge ID')
];

// Routes
router.get('/', protect, getAllBadges);
router.get('/my-badges', protect, async (req, res, next) => {
  req.params.userId = req.user.id;
  return getUserBadges(req, res, next);
});
router.get('/:userId', protect, getUserBadges);
router.post('/award', protect, restrictTo('admin'), awardBadgeValidation, validate, awardBadge);
router.post('/check/:userId', protect, checkAndAwardBadges);

module.exports = router;
