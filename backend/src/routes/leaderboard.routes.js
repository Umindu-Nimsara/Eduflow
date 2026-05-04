const express = require('express');
const router = express.Router();
const {
  getLeaderboard,
  getUserStats,
  addPoints,
  getGlobalLeaderboard
} = require('../controllers/leaderboard.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');

router.use(protect);

router.get('/global', getGlobalLeaderboard);
router.get('/course/:courseId', getLeaderboard);
router.get('/course/:courseId/my-stats', getUserStats);
router.post('/points', restrictTo('instructor', 'admin'), addPoints);

module.exports = router;


