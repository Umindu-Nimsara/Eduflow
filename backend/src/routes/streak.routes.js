const express = require('express');
const { protect } = require('../middleware/auth.middleware');
const {
  getStreakByUser,
  updateStreak
} = require('../controllers/streak.controller');

const router = express.Router();

// Routes
router.get('/my-streak', protect, async (req, res, next) => {
  req.params.userId = req.user.id;
  return getStreakByUser(req, res, next);
});
router.get('/:userId', protect, getStreakByUser);
router.post('/update', protect, updateStreak);

module.exports = router;
