const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const Enrollment = require('../models/Enrollment.model');
const Course = require('../models/Course.model');
const UserProfile = require('../models/UserProfile.model');
const { createNotification, NOTIFICATION_TYPES } = require('../utils/notificationHelper');

// @desc    Get enrollments by user or course
// @route   GET /api/enrollments/:userId OR GET /api/enrollments?courseId=xxx
// @access  Private
exports.getEnrollmentsByUser = asyncHandler(async (req, res, next) => {
  const Progress = require('../models/Progress.model');
  const Lesson = require('../models/Lesson.model');
  
  // Check if querying by courseId (for instructors to see enrolled students)
  if (req.query.courseId) {
    const courseId = req.query.courseId;
    
    // Verify the course exists and user has access
    const course = await Course.findById(courseId);
    if (!course) {
      return next(new AppError('Course not found', 404));
    }
    
    // Only instructor of the course or admin can view enrollments
    if (course.instructorId.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new AppError('You are not authorized to view these enrollments', 403));
    }
    
    const enrollments = await Enrollment.find({ courseId })
      .populate('userId', 'name email profilePhoto')
      .sort({ enrolledAt: -1 });
    
    // Calculate real-time progress for each enrollment
    const transformedEnrollments = await Promise.all(enrollments.map(async (enrollment) => {
      const totalLessons = await Lesson.countDocuments({ courseId });
      const completedLessons = await Progress.countDocuments({
        userId: enrollment.userId._id,
        courseId,
        completed: true
      });
      
      const calculatedProgress = totalLessons > 0 
        ? Math.round((completedLessons / totalLessons) * 100) 
        : 0;
      
      return {
        _id: enrollment._id,
        userId: enrollment.userId,
        progress: calculatedProgress,
        completionPercentage: calculatedProgress,
        enrolledAt: enrollment.enrolledAt,
        lastAccessedAt: enrollment.lastAccessedAt,
        certificateIssued: enrollment.certificateIssued
      };
    }));
    
    return res.status(200).json({
      success: true,
      data: transformedEnrollments
    });
  }
  
  // Original logic for getting user's enrollments
  // Users can only view their own enrollments, unless admin
  if (req.params.userId !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('You are not authorized to view these enrollments', 403));
  }

  const enrollments = await Enrollment.find({ userId: req.params.userId })
    .populate('courseId', 'title thumbnail category instructorId totalLessons')
    .sort({ enrolledAt: -1 });

  // Calculate real-time progress for each enrollment
  const transformedEnrollments = await Promise.all(enrollments.map(async (enrollment) => {
    const courseId = enrollment.courseId._id;
    const totalLessons = await Lesson.countDocuments({ courseId });
    const completedLessons = await Progress.countDocuments({
      userId: req.params.userId,
      courseId,
      completed: true
    });
    
    const calculatedProgress = totalLessons > 0 
      ? Math.round((completedLessons / totalLessons) * 100) 
      : 0;
    
    // Update enrollment if progress has changed
    if (calculatedProgress !== enrollment.completionPercentage) {
      await Enrollment.findByIdAndUpdate(enrollment._id, {
        completionPercentage: calculatedProgress
      });
    }
    
    return {
      _id: enrollment._id,
      course: enrollment.courseId,
      courseId: enrollment.courseId,
      progress: calculatedProgress,
      completionPercentage: calculatedProgress,
      enrolledAt: enrollment.enrolledAt,
      lastAccessedAt: enrollment.lastAccessedAt,
      certificateIssued: enrollment.certificateIssued
    };
  }));

  res.status(200).json({
    success: true,
    data: transformedEnrollments
  });
});

// @desc    Enroll in course
// @route   POST /api/enrollments/enroll
// @access  Private
exports.enrollCourse = asyncHandler(async (req, res, next) => {
  const { courseId } = req.body;

  // Check if course exists
  const course = await Course.findById(courseId);
  if (!course) {
    return next(new AppError('Course not found', 404));
  }

  // Check if already enrolled
  const existingEnrollment = await Enrollment.findOne({
    userId: req.user.id,
    courseId
  });

  if (existingEnrollment) {
    return next(new AppError('You are already enrolled in this course', 400));
  }

  // Create enrollment
  const enrollment = await Enrollment.create({
    userId: req.user.id,
    courseId
  });

  // Add course to user profile enrolled courses
  await UserProfile.findOneAndUpdate(
    { userId: req.user.id },
    { $addToSet: { enrolledCourses: courseId } }
  );

  // Create notification
  await createNotification(
    req.user.id,
    'Enrollment Confirmed',
    `You have successfully enrolled in "${course.title}"`,
    NOTIFICATION_TYPES.ENROLLMENT_CONFIRMED,
    enrollment._id,
    'Enrollment'
  );

  res.status(201).json({
    success: true,
    message: 'Enrolled successfully',
    data: enrollment
  });
});

// @desc    Unenroll from course
// @route   DELETE /api/enrollments/:id
// @access  Private
exports.unenrollCourse = asyncHandler(async (req, res, next) => {
  const enrollment = await Enrollment.findById(req.params.id);

  if (!enrollment) {
    return next(new AppError('Enrollment not found', 404));
  }

  // Users can only unenroll themselves, unless admin
  if (enrollment.userId.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('You are not authorized to unenroll from this course', 403));
  }

  // Remove course from user profile
  await UserProfile.findOneAndUpdate(
    { userId: enrollment.userId },
    { $pull: { enrolledCourses: enrollment.courseId } }
  );

  await Enrollment.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: 'Unenrolled successfully'
  });
});
