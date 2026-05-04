const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const Lesson = require('../models/Lesson.model');
const Course = require('../models/Course.model');
const { uploadToCloudinary } = require('../config/cloudinary');

// @desc    Get all lessons for a course
// @route   GET /api/courses/:id/lessons
// @access  Public
exports.getLessonsByCourse = asyncHandler(async (req, res, next) => {
  // Route uses :id, not :courseId
  const courseId = req.params.id || req.params.courseId;
  
  console.log('=== GET LESSONS BY COURSE ===');
  console.log('Requested courseId:', courseId);
  console.log('req.params:', req.params);
  
  const lessons = await Lesson.find({ courseId: courseId })
    .sort({ orderIndex: 1 });
  
  console.log('Found lessons:', lessons.length);

  res.status(200).json({
    success: true,
    data: lessons
  });
});

// @desc    Get single lesson by ID
// @route   GET /api/lessons/:id
// @access  Public
exports.getLessonById = asyncHandler(async (req, res, next) => {
  const lesson = await Lesson.findById(req.params.id)
    .populate('courseId', 'title instructorId');

  if (!lesson) {
    return next(new AppError('Lesson not found', 404));
  }

  res.status(200).json({
    success: true,
    data: lesson
  });
});

// @desc    Create new lesson
// @route   POST /api/lessons
// @access  Private (Instructor)
exports.createLesson = asyncHandler(async (req, res, next) => {
  const { courseId, title, videoUrl, pdfUrl, duration, orderIndex, description, content, resources } = req.body;

  // Check if course exists
  const course = await Course.findById(courseId);
  if (!course) {
    return next(new AppError('Course not found', 404));
  }

  // Check ownership
  if (course.instructorId.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('You are not authorized to add lessons to this course', 403));
  }

  const lesson = await Lesson.create({
    courseId,
    title,
    videoUrl: videoUrl || '',
    pdfUrl:   pdfUrl   || '',
    duration:   parseInt(duration)   || 0,
    orderIndex: parseInt(orderIndex) || 0,
    description: description || content || '',
    resources: resources ? resources.split(',').map(r => r.trim()) : []
  });

  // Update course total lessons count
  course.totalLessons = await Lesson.countDocuments({ courseId });
  await course.save();

  res.status(201).json({
    success: true,
    message: 'Lesson created successfully',
    data: lesson
  });
});

// @desc    Update lesson
// @route   PUT /api/lessons/:id
// @access  Private (Instructor - own courses)
exports.updateLesson = asyncHandler(async (req, res, next) => {
  let lesson = await Lesson.findById(req.params.id).populate('courseId');

  if (!lesson) {
    return next(new AppError('Lesson not found', 404));
  }

  // Check ownership
  if (lesson.courseId.instructorId.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('You are not authorized to update this lesson', 403));
  }

  const { title, videoUrl, duration, orderIndex, description, resources } = req.body;

  lesson = await Lesson.findByIdAndUpdate(
    req.params.id,
    {
      title,
      videoUrl,
      duration,
      orderIndex,
      description,
      resources: resources ? resources.split(',').map(r => r.trim()) : lesson.resources
    },
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    message: 'Lesson updated successfully',
    data: lesson
  });
});

// @desc    Delete lesson
// @route   DELETE /api/lessons/:id
// @access  Private (Instructor - own courses)
exports.deleteLesson = asyncHandler(async (req, res, next) => {
  const lesson = await Lesson.findById(req.params.id).populate('courseId');

  if (!lesson) {
    return next(new AppError('Lesson not found', 404));
  }

  // Check ownership
  if (lesson.courseId.instructorId.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('You are not authorized to delete this lesson', 403));
  }

  const courseId = lesson.courseId._id;

  await Lesson.findByIdAndDelete(req.params.id);

  // Update course total lessons count
  const course = await Course.findById(courseId);
  course.totalLessons = await Lesson.countDocuments({ courseId });
  await course.save();

  res.status(200).json({
    success: true,
    message: 'Lesson deleted successfully'
  });
});

// @desc    Upload lesson video
// @route   POST /api/lessons/upload-video
// @access  Private (Instructor)
exports.uploadVideo = asyncHandler(async (req, res, next) => {
  console.log('=== VIDEO UPLOAD REQUEST ===');
  console.log('File:', req.file ? 'Present' : 'Missing');
  
  if (!req.file) {
    console.log('❌ No file in request');
    console.log('Request content-type:', req.headers['content-type']);
    console.log('Request body keys:', Object.keys(req.body || {}));
    return next(new AppError('Please upload a video file. Make sure the field name is "video".', 400));
  }

  const fileSizeMB = (req.file.size / 1024 / 1024).toFixed(2);
  console.log('📹 Video file details:');
  console.log('  - Original name:', req.file.originalname);
  console.log('  - Size:', fileSizeMB, 'MB');
  console.log('  - Mimetype:', req.file.mimetype);
  console.log('  - Buffer present:', !!req.file.buffer);
  console.log('  - Buffer size:', req.file.buffer ? req.file.buffer.length : 0);

  // Validate buffer exists
  if (!req.file.buffer || req.file.buffer.length === 0) {
    console.error('❌ File buffer is empty');
    return next(new AppError('Video file data is empty. Please try again.', 400));
  }
  
  console.log('☁️  Starting upload... (this may take a while for large files)');
  
  try {
    const startTime = Date.now();
    const result = await uploadToCloudinary(
      req.file.buffer, 
      'lessons/videos', 
      'video',
      req.file.originalname
    );

    const uploadTime = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`✅ Video uploaded successfully in ${uploadTime}s!`);
    console.log('  - URL:', result.secure_url || result.url);
    console.log('  - Duration:', result.duration || 0);
    console.log('  - Public ID:', result.public_id);

    res.status(200).json({
      success: true,
      message: 'Video uploaded successfully',
      data: {
        url:      result.secure_url || result.url,
        duration: result.duration || 0,
        publicId: result.public_id,
      }
    });
  } catch (uploadError) {
    console.error('❌ Video upload error:', uploadError.message || uploadError);
    
    let errorMessage = 'Failed to upload video';
    if (uploadError.message?.includes('timeout')) {
      errorMessage = 'Video upload timed out. Try a smaller file or check your internet connection.';
    } else if (uploadError.message?.includes('File size too large')) {
      errorMessage = 'Video file is too large. Maximum allowed size is 100MB for free Cloudinary plan.';
    } else if (uploadError.http_code === 400) {
      errorMessage = 'Invalid video file. Please ensure the file is a valid video format (MP4, MOV, AVI).';
    } else if (uploadError.message) {
      errorMessage = uploadError.message;
    }
    
    return next(new AppError(errorMessage, 500));
  }
});

// @desc    Upload lesson document (PDF, DOC, etc.)
// @route   POST /api/lessons/upload-document
// @access  Private (Instructor)
exports.uploadDocument = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError('Please upload a document file', 400));
  }

  console.log('Uploading document to Cloudinary...');

  const result = await uploadToCloudinary(
    req.file.buffer, 
    'lessons/documents', 
    'raw',
    req.file.originalname
  );

  console.log('Document uploaded successfully:', result.secure_url || result.url);

  res.status(200).json({
    success: true,
    message: 'Document uploaded successfully',
    data: {
      url:  result.secure_url || result.url,
      name: req.file.originalname,
      publicId: result.public_id,
    }
  });
});
