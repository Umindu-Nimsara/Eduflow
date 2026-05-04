const PeerReview = require('../models/PeerReview.model');
const Assignment = require('../models/Assignment.model');
const AssignmentSubmission = require('../models/AssignmentSubmission.model');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

// @desc    Create peer review
// @route   POST /api/peer-reviews
// @access  Private (Student)
exports.createPeerReview = asyncHandler(async (req, res, next) => {
  const { submissionId, criteria, overallScore, strengths, improvements, additionalComments } = req.body;

  const submission = await AssignmentSubmission.findById(submissionId).populate('assignmentId');
  if (!submission) {
    return next(new AppError('Submission not found', 404));
  }

  // Check if already reviewed
  const existingReview = await PeerReview.findOne({
    submissionId,
    reviewerId: req.user._id
  });

  if (existingReview) {
    return next(new AppError('You have already reviewed this submission', 400));
  }

  // Cannot review own submission
  if (submission.userId.toString() === req.user._id.toString()) {
    return next(new AppError('Cannot review your own submission', 400));
  }

  const peerReview = await PeerReview.create({
    assignmentId: submission.assignmentId._id,
    submissionId,
    reviewerId: req.user._id,
    revieweeId: submission.userId,
    criteria,
    overallScore,
    strengths,
    improvements,
    additionalComments,
    status: 'submitted',
    submittedAt: new Date()
  });

  await peerReview.populate('reviewerId', 'name email');

  res.status(201).json({
    success: true,
    data: peerReview
  });
});

// @desc    Get peer reviews for submission
// @route   GET /api/peer-reviews/submission/:submissionId
// @access  Private
exports.getPeerReviewsBySubmission = asyncHandler(async (req, res, next) => {
  const { submissionId } = req.params;

  const reviews = await PeerReview.find({ submissionId, status: 'approved' })
    .populate('reviewerId', 'name email')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: reviews.length,
    data: reviews
  });
});

// @desc    Get peer reviews by assignment
// @route   GET /api/peer-reviews/assignment/:assignmentId
// @access  Private (Instructor)
exports.getPeerReviewsByAssignment = asyncHandler(async (req, res, next) => {
  const { assignmentId } = req.params;

  const reviews = await PeerReview.find({ assignmentId })
    .populate('reviewerId', 'name email')
    .populate('revieweeId', 'name email')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: reviews.length,
    data: reviews
  });
});

// @desc    Approve peer review
// @route   PUT /api/peer-reviews/:id/approve
// @access  Private (Instructor)
exports.approvePeerReview = asyncHandler(async (req, res, next) => {
  const review = await PeerReview.findById(req.params.id);

  if (!review) {
    return next(new AppError('Peer review not found', 404));
  }

  review.status = 'approved';
  review.approvedBy = req.user._id;
  review.approvedAt = new Date();
  await review.save();

  res.status(200).json({
    success: true,
    data: review
  });
});

// @desc    Get reviews assigned to student
// @route   GET /api/peer-reviews/my-reviews
// @access  Private (Student)
exports.getMyReviews = asyncHandler(async (req, res, next) => {
  const reviews = await PeerReview.find({ reviewerId: req.user._id })
    .populate('submissionId')
    .populate('revieweeId', 'name email')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: reviews.length,
    data: reviews
  });
});

// @desc    Get reviews received by student
// @route   GET /api/peer-reviews/received
// @access  Private (Student)
exports.getReceivedReviews = asyncHandler(async (req, res, next) => {
  const reviews = await PeerReview.find({ 
    revieweeId: req.user._id,
    status: 'approved'
  })
    .populate('reviewerId', 'name email')
    .populate('submissionId')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: reviews.length,
    data: reviews
  });
});
