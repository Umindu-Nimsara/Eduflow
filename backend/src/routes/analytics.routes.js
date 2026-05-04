const express = require('express');
const router = express.Router();
const {
  getOverview,
  getStudentAnalytics,
  getInstructorAnalytics,
  getWeeklyActivity,
  getUserGrowth
} = require('../controllers/analytics.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');

// @route   GET /api/analytics/overview
// @desc    Get admin overview statistics
// @access  Private (Admin)
router.get('/overview', protect, restrictTo('admin'), getOverview);

// @route   GET /api/analytics/weekly-activity
// @desc    Get weekly activity data
// @access  Private (Admin)
router.get('/weekly-activity', protect, restrictTo('admin'), getWeeklyActivity);

// @route   GET /api/analytics/user-growth
// @desc    Get user growth data
// @access  Private (Admin)
router.get('/user-growth', protect, restrictTo('admin'), getUserGrowth);

// @route   GET /api/analytics/student
// @desc    Get student analytics
// @access  Private (Student)
router.get('/student', protect, restrictTo('student'), getStudentAnalytics);

// @route   GET /api/analytics/instructor
// @desc    Get instructor analytics
// @access  Private (Instructor)
router.get('/instructor', protect, restrictTo('instructor'), getInstructorAnalytics);

module.exports = router;
