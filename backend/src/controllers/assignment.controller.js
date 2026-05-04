const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const Assignment = require('../models/Assignment.model');
const Course = require('../models/Course.model');
const { uploadToCloudinary } = require('../config/cloudinary');

// @desc    Get assignments by course
// @route   GET /api/assignments?courseId=xxx
// @access  Public
exports.getAssignmentsByCourse = asyncHandler(async (req, res, next) => {
  const courseId = req.params.courseId || req.query.courseId;
  
  if (!courseId) {
    return next(new AppError('Course ID is required', 400));
  }

  const assignments = await Assignment.find({ courseId: courseId })
    .sort({ dueDate: 1 });

  res.status(200).json({
    success: true,
    data: assignments
  });
});

// @desc    Get single assignment by ID
// @route   GET /api/assignments/:id
// @access  Public
exports.getAssignmentById = asyncHandler(async (req, res, next) => {
  const assignment = await Assignment.findById(req.params.id)
    .populate('courseId', 'title instructorId');

  if (!assignment) {
    return next(new AppError('Assignment not found', 404));
  }

  res.status(200).json({
    success: true,
    data: assignment
  });
});

// @desc    Create new assignment
// @route   POST /api/assignments
// @access  Private (Instructor)
exports.createAssignment = asyncHandler(async (req, res, next) => {
  const { courseId, title, description, dueDate, totalMarks, attachmentUrl } = req.body;

  // Check if course exists
  const course = await Course.findById(courseId);
  if (!course) {
    return next(new AppError('Course not found', 404));
  }

  // Check ownership
  if (course.instructorId.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('You are not authorized to create assignments for this course', 403));
  }

  const assignment = await Assignment.create({
    courseId,
    title,
    description,
    dueDate,
    totalMarks,
    attachmentUrl: attachmentUrl || ''
  });

  res.status(201).json({
    success: true,
    message: 'Assignment created successfully',
    data: assignment
  });
});

// @desc    Update assignment
// @route   PUT /api/assignments/:id
// @access  Private (Instructor)
exports.updateAssignment = asyncHandler(async (req, res, next) => {
  let assignment = await Assignment.findById(req.params.id).populate('courseId');

  if (!assignment) {
    return next(new AppError('Assignment not found', 404));
  }

  // Check ownership
  if (assignment.courseId.instructorId.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('You are not authorized to update this assignment', 403));
  }

  const { title, description, dueDate, totalMarks, attachmentUrl } = req.body;

  assignment = await Assignment.findByIdAndUpdate(
    req.params.id,
    { title, description, dueDate, totalMarks, attachmentUrl },
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    message: 'Assignment updated successfully',
    data: assignment
  });
});

// @desc    Delete assignment
// @route   DELETE /api/assignments/:id
// @access  Private (Instructor)
exports.deleteAssignment = asyncHandler(async (req, res, next) => {
  const assignment = await Assignment.findById(req.params.id).populate('courseId');

  if (!assignment) {
    return next(new AppError('Assignment not found', 404));
  }

  // Check ownership
  if (assignment.courseId.instructorId.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('You are not authorized to delete this assignment', 403));
  }

  await Assignment.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: 'Assignment deleted successfully'
  });
});

// @desc    Upload assignment attachment
// @route   POST /api/assignments/upload
// @access  Private (Instructor)
exports.uploadAttachment = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError('Please upload a file', 400));
  }

  // Upload to Cloudinary
  const result = await uploadToCloudinary(req.file.buffer, 'assignments/attachments', 'raw');

  res.status(200).json({
    success: true,
    message: 'Attachment uploaded successfully',
    data: {
      url: result.secure_url
    }
  });
});
