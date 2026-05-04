const User = require('../models/User.model');
const Course = require('../models/Course.model');
const Enrollment = require('../models/Enrollment.model');
const Progress = require('../models/Progress.model');
const QuizAttempt = require('../models/QuizAttempt.model');
const AssignmentSubmission = require('../models/AssignmentSubmission.model');
const Certificate = require('../models/Certificate.model');
const asyncHandler = require('../utils/asyncHandler');

exports.exportUserData = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;

  // Gather all user data
  const [
    user,
    enrollments,
    progress,
    quizAttempts,
    submissions,
    certificates
  ] = await Promise.all([
    User.findById(userId).select('-password'),
    Enrollment.find({ userId }).populate('courseId', 'title'),
    Progress.find({ userId }).populate('courseId', 'title'),
    QuizAttempt.find({ userId }).populate('quizId', 'title'),
    AssignmentSubmission.find({ userId }).populate('assignmentId', 'title'),
    Certificate.find({ userId }).populate('courseId', 'title')
  ]);

  const exportData = {
    exportDate: new Date(),
    user: {
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt
    },
    enrollments: enrollments.map(e => ({
      course: e.courseId?.title,
      enrolledAt: e.createdAt,
      status: e.status
    })),
    progress: progress.map(p => ({
      course: p.courseId?.title,
      completionPercentage: p.completionPercentage,
      completedLessons: p.completedLessons?.length || 0
    })),
    quizAttempts: quizAttempts.map(q => ({
      quiz: q.quizId?.title,
      score: q.score,
      totalMarks: q.totalMarks,
      percentage: q.percentage,
      completedAt: q.completedAt
    })),
    assignments: submissions.map(s => ({
      assignment: s.assignmentId?.title,
      grade: s.grade,
      totalMarks: s.totalMarks,
      submittedAt: s.submittedAt
    })),
    certificates: certificates.map(c => ({
      course: c.courseId?.title,
      issuedAt: c.issuedAt,
      certificateId: c.certificateId
    })),
    statistics: {
      totalEnrollments: enrollments.length,
      totalQuizzes: quizAttempts.length,
      totalAssignments: submissions.length,
      totalCertificates: certificates.length,
      averageQuizScore: quizAttempts.length > 0
        ? quizAttempts.reduce((sum, q) => sum + q.percentage, 0) / quizAttempts.length
        : 0
    }
  };

  res.status(200).json({
    success: true,
    data: exportData
  });
});

exports.exportCourseData = asyncHandler(async (req, res, next) => {
  const { courseId } = req.params;

  const course = await Course.findById(courseId).populate('instructorId', 'name email');

  if (!course) {
    return next(new AppError('Course not found', 404));
  }

  // Verify ownership
  if (course.instructorId._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return next(new AppError('Not authorized', 403));
  }

  const [enrollments, progress] = await Promise.all([
    Enrollment.find({ courseId }).populate('userId', 'name email'),
    Progress.find({ courseId }).populate('userId', 'name email')
  ]);

  const exportData = {
    exportDate: new Date(),
    course: {
      title: course.title,
      description: course.description,
      instructor: course.instructorId.name,
      createdAt: course.createdAt
    },
    enrollments: enrollments.map(e => ({
      student: e.userId?.name,
      email: e.userId?.email,
      enrolledAt: e.createdAt,
      status: e.status
    })),
    progress: progress.map(p => ({
      student: p.userId?.name,
      completionPercentage: p.completionPercentage,
      completedLessons: p.completedLessons?.length || 0,
      lastAccessed: p.lastAccessed
    })),
    statistics: {
      totalEnrollments: enrollments.length,
      averageCompletion: progress.length > 0
        ? progress.reduce((sum, p) => sum + p.completionPercentage, 0) / progress.length
        : 0
    }
  };

  res.status(200).json({
    success: true,
    data: exportData
  });
});
