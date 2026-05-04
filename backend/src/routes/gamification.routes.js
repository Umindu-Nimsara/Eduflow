const express = require('express');
const { protect } = require('../middleware/auth.middleware');
const gamificationController = require('../controllers/gamification.controller');

const router = express.Router();

// Public routes
router.get('/leaderboard', gamificationController.getLeaderboard);
router.get('/badges', gamificationController.getAllBadges);

// Protected routes
router.get('/me', protect, gamificationController.getMyGamification);
router.post('/award-points', protect, gamificationController.awardPoints);
router.get('/daily-challenges', protect, gamificationController.getDailyChallenges);
router.put('/challenge/:challengeId', protect, gamificationController.updateChallengeProgress);

module.exports = router;
