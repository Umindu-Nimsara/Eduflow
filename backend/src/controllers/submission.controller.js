const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const AssignmentSubmission = require('../models/AssignmentSubmission.model');
const Assignment = require('../models/Assignment.model');
const { uploadToCloudinary } = require('../config/cloudinary');
const { createNotification, NOTIFICATION_TYPES } = require('../utils/notificationHelper');

// @desc    Submit assignment
// @route   POST /api/submissions
// @access  Private (Student)
exports.submitAssignment = asyncHandler(async (req, res, next) => {
  const { assignmentId, submissionUrl, submissionText } = req.body;

  if (!assignmentId) {
    return next(new AppError('Assignment ID is required', 400));
  }

  if (!submissionUrl && !submissionText && !req.file) {
    return next(new AppError('Please provide submission text or attach a file', 400));
  }

  const assignment = await Assignment.findById(assignmentId);
  if (!assignment) {
    return next(new AppError('Assignment not found', 404));
  }

  // Check if already submitted - allow resubmission
  const existingSubmission = await AssignmentSubmission.findOne({
    assignmentId,
    userId: req.user.id
  });

  let fileUrl = submissionUrl;

  // If file uploaded directly with this request
  if (req.file) {
    const result = await uploadToCloudinary(
      req.file.buffer, 
      'submissions', 
      'raw',
      req.file.originalname
    );
    fileUrl = result.secure_url || result.url;
  }

  let submission;
  if (existingSubmission) {
    // Update existing submission
    submission = await AssignmentSubmission.findByIdAndUpdate(
      existingSubmission._id,
      {
        submissionUrl: fileUrl || existingSubmission.submissionUrl,
        submissionText: submissionText || existingSubmission.submissionText,
        submittedAt: new Date(),
        isGraded: false,
      },
      { new: true }
    );
  } else {
    submission = await AssignmentSubmission.create({
      assignmentId,
      userId: req.user.id,
      submissionUrl: fileUrl,
      submissionText,
    });
  }

  res.status(201).json({
    success: true,
    message: 'Assignment submitted successfully',
    data: submission
  });
});

// @desc    Grade assignment submission
// @route   PUT /api/submissions/:id/grade
// @access  Private (Instructor)
exports.gradeSubmission = asyncHandler(async (req, res, next) => {
  const { grade, feedback } = req.body;

  let submission = await AssignmentSubmission.findById(req.params.id)
    .populate({
      path: 'assignmentId',
      populate: { path: 'courseId' }
    });

  if (!submission) {
    return next(new AppError('Submission not found', 404));
  }

  // Check ownership
  if (submission.assignmentId.courseId.instructorId.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('You are not authorized to grade this submission', 403));
  }

  submission = await AssignmentSubmission.findByIdAndUpdate(
    req.params.id,
    { grade, feedback, isGraded: true },
    { new: true, runValidators: true }
  );

  // Create notification for student
  await createNotification(
    submission.userId,
    'Assignment Graded',
    `Your assignment "${submission.assignmentId.title}" has been graded. Score: ${grade}/${submission.assignmentId.totalMarks}`,
    NOTIFICATION_TYPES.ASSIGNMENT_GRADED,
    submission._id,
    'AssignmentSubmission'
  );

  res.status(200).json({
    success: true,
    message: 'Submission graded successfully',
    data: submission
  });
});

// @desc    Get submissions by assignment
// @route   GET /api/submissions/assignment/:assignmentId
// @access  Private (Instructor)
exports.getSubmissionsByAssignment = asyncHandler(async (req, res, next) => {
  const assignment = await Assignment.findById(req.params.assignmentId).populate('courseId');

  if (!assignment) {
    return next(new AppError('Assignment not found', 404));
  }

  const userId = req.user._id || req.user.id;

  // Check ownership
  if (assignment.courseId.instructorId.toString() !== userId.toString() && req.user.role !== 'admin') {
    return next(new AppError('You are not authorized to view these submissions', 403));
  }

  const submissions = await AssignmentSubmission.find({ assignmentId: req.params.assignmentId })
    .populate('userId', 'name email')
    .sort({ submittedAt: -1 });

  res.status(200).json({
    success: true,
    data: submissions
  });
});

// @desc    Get user submissions
// @route   GET /api/submissions/user/:userId
// @access  Private
exports.getUserSubmissions = asyncHandler(async (req, res, next) => {
  const userId = req.user._id || req.user.id;
  
  // Users can only view their own submissions, unless admin
  if (req.params.userId !== userId.toString() && req.user.role !== 'admin') {
    return next(new AppError('You are not authorized to view these submissions', 403));
  }

  const submissions = await AssignmentSubmission.find({ userId: req.params.userId })
    .populate('assignmentId', 'title courseId dueDate totalMarks')
    .sort({ submittedAt: -1 });

  res.status(200).json({
    success: true,
    data: submissions
  });
});

// @desc    Upload submission file
// @route   POST /api/submissions/upload
// @access  Private (Student)
exports.uploadSubmission = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError('Please upload a file', 400));
  }

  // Upload to Cloudinary or local storage
  const result = await uploadToCloudinary(
    req.file.buffer, 
    'submissions', 
    'raw',
    req.file.originalname
  );

  res.status(200).json({
    success: true,
    message: 'Submission file uploaded successfully',
    data: {
      url: result.secure_url || result.url
    }
  });
});
