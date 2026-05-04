const express = require('express');
const router = express.Router();
const {
  createLiveClass,
  getLiveClassesByCourse,
  getLiveClass,
  updateLiveClass,
  deleteLiveClass,
  joinLiveClass,
  leaveLiveClass,
  getInstructorUpcomingClasses
} = require('../controllers/liveClass.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(protect);

// Create live class (instructor only)
router.post('/', restrictTo('instructor', 'admin'), createLiveClass);

// Get instructor's upcoming classes
router.get('/instructor/upcoming', restrictTo('instructor', 'admin'), getInstructorUpcomingClasses);

// Get live classes for a course
router.get('/course/:courseId', getLiveClassesByCourse);

// Get single live class
router.get('/:id', getLiveClass);

// Update live class (instructor only)
router.put('/:id', restrictTo('instructor', 'admin'), updateLiveClass);

// Delete live class (instructor only)
router.delete('/:id', restrictTo('instructor', 'admin'), deleteLiveClass);

// Join live class
router.post('/:id/join', joinLiveClass);

// Leave live class
router.post('/:id/leave', leaveLiveClass);

module.exports = router;


