const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const Certificate = require('../models/Certificate.model');
const Enrollment = require('../models/Enrollment.model');
const Course = require('../models/Course.model');
const User = require('../models/User.model');
const { createNotification, NOTIFICATION_TYPES } = require('../utils/notificationHelper');

// @desc    Get certificates by user
// @route   GET /api/certificates/:userId
// @access  Private
exports.getCertificatesByUser = asyncHandler(async (req, res, next) => {
  // Users can only view their own certificates, unless admin
  if (req.params.userId !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('You are not authorized to view these certificates', 403));
  }

  const certificates = await Certificate.find({ userId: req.params.userId })
    .populate({
      path: 'courseId',
      select: 'title thumbnail instructorId',
      populate: {
        path: 'instructorId',
        select: 'name'
      }
    })
    .populate('userId', 'name email')
    .sort({ issuedAt: -1 });

  // Transform data to match frontend expectations
  const transformedCertificates = certificates.map(cert => ({
    _id: cert._id,
    certificateId: `CERT-${cert._id.toString().slice(-8).toUpperCase()}`,
    student: {
      name: cert.userId?.name || 'Student'
    },
    course: {
      title: cert.courseId?.title || 'Course',
      instructor: {
        name: cert.courseId?.instructorId?.name || 'Instructor'
      }
    },
    issuedAt: cert.issuedAt,
    completionDate: cert.issuedAt, // Using issuedAt as completion date
    certificateUrl: cert.certificateUrl
  }));

  res.status(200).json({
    success: true,
    data: transformedCertificates
  });
});

// @desc    Generate certificate
// @route   POST /api/certificates/generate
// @access  Private
exports.generateCertificate = asyncHandler(async (req, res, next) => {
  const { courseId } = req.body;

  // Check if course exists
  const course = await Course.findById(courseId);
  if (!course) {
    return next(new AppError('Course not found', 404));
  }

  // Check if user is enrolled
  const enrollment = await Enrollment.findOne({
    userId: req.user.id,
    courseId
  });

  if (!enrollment) {
    return next(new AppError('You are not enrolled in this course', 400));
  }

  // Check if course is completed (100%)
  if (enrollment.completionPercentage < 100) {
    return next(new AppError('You must complete the course to receive a certificate', 400));
  }

  // Check if certificate already exists
  const existingCertificate = await Certificate.findOne({
    userId: req.user.id,
    courseId
  });

  if (existingCertificate) {
    return next(new AppError('Certificate already issued for this course', 400));
  }

  // Get user details
  const user = await User.findById(req.user.id);

  // Generate certificate URL (in production, use a certificate generation service)
  // For now, we'll create a placeholder URL
  const certificateUrl = `https://certificates.elearning.com/${req.user.id}/${courseId}/${Date.now()}.pdf`;

  // Create certificate
  const certificate = await Certificate.create({
    userId: req.user.id,
    courseId,
    certificateUrl
  });

  // Update enrollment
  enrollment.certificateIssued = true;
  await enrollment.save();

  // Create notification
  await createNotification(
    req.user.id,
    'Certificate Issued',
    `Congratulations! Your certificate for "${course.title}" is ready`,
    NOTIFICATION_TYPES.CERTIFICATE_ISSUED,
    certificate._id,
    'Certificate'
  );

  res.status(201).json({
    success: true,
    message: 'Certificate generated successfully',
    data: certificate
  });
});

// @desc    Issue certificate manually (Instructor)
// @route   POST /api/certificates/issue
// @access  Private (Instructor)
exports.issueCertificate = asyncHandler(async (req, res, next) => {
  const { userId, courseId } = req.body;

  if (!userId || !courseId) {
    return next(new AppError('User ID and Course ID are required', 400));
  }

  // Check if course exists and instructor owns it
  const course = await Course.findById(courseId);
  if (!course) {
    return next(new AppError('Course not found', 404));
  }

  if (course.instructorId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return next(new AppError('Not authorized to issue certificates for this course', 403));
  }

  // Check if user is enrolled
  const enrollment = await Enrollment.findOne({ userId, courseId });
  if (!enrollment) {
    return next(new AppError('User is not enrolled in this course', 400));
  }

  // Check if certificate already exists
  const existingCertificate = await Certificate.findOne({ userId, courseId });
  if (existingCertificate) {
    return next(new AppError('Certificate already issued for this user', 400));
  }

  // Get user details
  const user = await User.findById(userId);

  // Generate certificate URL
  const certificateUrl = `https://certificates.elearning.com/${userId}/${courseId}/${Date.now()}.pdf`;

  // Create certificate
  const certificate = await Certificate.create({
    userId,
    courseId,
    certificateUrl
  });

  // Update enrollment
  enrollment.certificateIssued = true;
  await enrollment.save();

  // Create notification
  await createNotification(
    userId,
    'Certificate Issued',
    `Congratulations! Your certificate for "${course.title}" has been issued`,
    NOTIFICATION_TYPES.CERTIFICATE_ISSUED,
    certificate._id,
    'Certificate'
  );

  res.status(201).json({
    success: true,
    message: 'Certificate issued successfully',
    data: certificate
  });
});

// @desc    Get all certificates for a course (Instructor)
// @route   GET /api/certificates/course/:courseId
// @access  Private (Instructor)
exports.getCertificatesByCourse = asyncHandler(async (req, res, next) => {
  const { courseId } = req.params;

  // Check if course exists and instructor owns it
  const course = await Course.findById(courseId);
  if (!course) {
    return next(new AppError('Course not found', 404));
  }

  if (course.instructorId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return next(new AppError('Not authorized to view certificates for this course', 403));
  }

  const certificates = await Certificate.find({ courseId })
    .populate('userId', 'name email profilePicture')
    .sort({ issuedAt: -1 });

  res.status(200).json({
    success: true,
    count: certificates.length,
    data: certificates
  });
});

// @desc    Revoke certificate (Instructor/Admin)
// @route   DELETE /api/certificates/:id
// @access  Private (Instructor/Admin)
exports.revokeCertificate = asyncHandler(async (req, res, next) => {
  const certificate = await Certificate.findById(req.params.id);

  if (!certificate) {
    return next(new AppError('Certificate not found', 404));
  }

  // Check authorization
  const course = await Course.findById(certificate.courseId);
  if (course.instructorId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return next(new AppError('Not authorized to revoke this certificate', 403));
  }

  // Update enrollment
  await Enrollment.findOneAndUpdate(
    { userId: certificate.userId, courseId: certificate.courseId },
    { certificateIssued: false }
  );

  await certificate.deleteOne();

  // Create notification
  await createNotification(
    certificate.userId,
    'Certificate Revoked',
    `Your certificate for "${course.title}" has been revoked`,
    NOTIFICATION_TYPES.GENERAL,
    null,
    null
  );

  res.status(200).json({
    success: true,
    message: 'Certificate revoked successfully',
    data: {}
  });
});

