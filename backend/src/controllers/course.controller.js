const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const Course = require('../models/Course.model');
const Lesson = require('../models/Lesson.model');
const { uploadToCloudinary } = require('../config/cloudinary');

// @desc    Get all courses with pagination, search, and filter
// @route   GET /api/courses
// @access  Public
exports.getAllCourses = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  // Build query
  let query = { isPublished: true };

  // Search by title, description, or tags
  if (req.query.search) {
    query.$text = { $search: req.query.search };
  }

  // Filter by category
  if (req.query.category) {
    query.category = req.query.category;
  }

  // Execute query with pagination
  const courses = await Course.find(query)
    .populate('instructorId', 'name email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Course.countDocuments(query);

  res.status(200).json({
    success: true,
    data: courses,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      total,
      limit
    }
  });
});

// @desc    Get single course by ID
// @route   GET /api/courses/:id
// @access  Public
exports.getCourseById = asyncHandler(async (req, res, next) => {
  const course = await Course.findById(req.params.id)
    .populate('instructorId', 'name email');

  if (!course) {
    return next(new AppError('Course not found', 404));
  }

  res.status(200).json({
    success: true,
    data: course
  });
});

// @desc    Create new course
// @route   POST /api/courses
// @access  Private (Instructor)
exports.createCourse = asyncHandler(async (req, res, next) => {
  console.log('=== CREATE COURSE REQUEST ===');
  console.log('Request method:', req.method);
  console.log('Request headers:', JSON.stringify(req.headers, null, 2));
  console.log('Request body keys:', Object.keys(req.body));
  console.log('Full request body:', JSON.stringify(req.body, null, 2));
  console.log('User ID:', req.user?.id);
  console.log('================================');
  
  const { title, description, category, price, tags, thumbnail, isPublished } = req.body;

  console.log('Extracted fields:');
  console.log('- title:', `"${title}"`);
  console.log('- description length:', description?.length);
  console.log('- category:', `"${category}"`);
  console.log('- price:', price);
  console.log('- thumbnail:', `"${thumbnail}"`);
  console.log('- thumbnail type:', typeof thumbnail);
  console.log('- isPublished:', isPublished);
  console.log('- tags:', tags);

  const courseData = {
    title,
    description,
    category,
    price,
    thumbnail: thumbnail || '', // Include thumbnail URL
    tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
    instructorId: req.user.id,
    isPublished: isPublished || false
  };
  
  console.log('Course data to save:', JSON.stringify(courseData, null, 2));

  const course = await Course.create(courseData);

  console.log('Course created in DB:');
  console.log('- ID:', course._id);
  console.log('- Title:', course.title);
  console.log('- Thumbnail:', `"${course.thumbnail}"`);
  console.log('- Thumbnail length:', course.thumbnail?.length);
  console.log('- Published:', course.isPublished);

  res.status(201).json({
    success: true,
    message: 'Course created successfully',
    data: course
  });
});

// @desc    Update course
// @route   PUT /api/courses/:id
// @access  Private (Instructor - own courses)
exports.updateCourse = asyncHandler(async (req, res, next) => {
  let course = await Course.findById(req.params.id);

  if (!course) {
    return next(new AppError('Course not found', 404));
  }

  // Check ownership
  if (course.instructorId.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('You are not authorized to update this course', 403));
  }

  const { title, description, category, price, tags, thumbnail, isPublished } = req.body;

  course = await Course.findByIdAndUpdate(
    req.params.id,
    {
      title,
      description,
      category,
      price,
      thumbnail: thumbnail !== undefined ? thumbnail : course.thumbnail, // Update thumbnail if provided
      tags: tags ? tags.split(',').map(tag => tag.trim()) : course.tags,
      isPublished,
      updatedAt: Date.now()
    },
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    message: 'Course updated successfully',
    data: course
  });
});

// @desc    Delete course
// @route   DELETE /api/courses/:id
// @access  Private (Instructor - own courses)
exports.deleteCourse = asyncHandler(async (req, res, next) => {
  const course = await Course.findById(req.params.id);

  if (!course) {
    return next(new AppError('Course not found', 404));
  }

  // Check ownership
  if (course.instructorId.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('You are not authorized to delete this course', 403));
  }

  // Delete all lessons associated with this course
  await Lesson.deleteMany({ courseId: req.params.id });

  await Course.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: 'Course and associated lessons deleted successfully'
  });
});

// @desc    Upload course thumbnail
// @route   POST /api/courses/upload
// @access  Private (Instructor)
exports.uploadThumbnail = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError('Please upload an image file', 400));
  }

  console.log('Uploading course thumbnail to Cloudinary...');
  console.log('File details:', {
    originalname: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size
  });

  try {
    const result = await uploadToCloudinary(
      req.file.buffer, 
      'courses/thumbnails', 
      'image',
      req.file.originalname
    );

    console.log('Thumbnail uploaded successfully:', result.secure_url || result.url);

    res.status(200).json({
      success: true,
      message: 'Thumbnail uploaded successfully',
      data: {
        url: result.secure_url || result.url,
        publicId: result.public_id,
        width: result.width,
        height: result.height
      }
    });
  } catch (error) {
    console.error('Thumbnail upload error:', error);
    return next(new AppError('Failed to upload thumbnail', 500));
  }
});

// @desc    Test endpoint for debugging
// @route   POST /api/courses/test-thumbnail
// @access  Private (Instructor)
exports.testThumbnail = asyncHandler(async (req, res, next) => {
  console.log('=== TEST THUMBNAIL ENDPOINT ===');
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  console.log('Thumbnail field:', req.body.thumbnail);
  console.log('Thumbnail type:', typeof req.body.thumbnail);
  console.log('===============================');
  
  res.status(200).json({
    success: true,
    message: 'Test endpoint working',
    data: {
      receivedThumbnail: req.body.thumbnail,
      thumbnailType: typeof req.body.thumbnail,
      allFields: Object.keys(req.body)
    }
  });
});

// @desc    Get courses by instructor
// @route   GET /api/courses/instructor/:instructorId
// @access  Public (but shows drafts if authenticated as that instructor)
exports.getCoursesByInstructor = asyncHandler(async (req, res, next) => {
  // If the requesting user is the instructor themselves, show all courses (including drafts)
  const isOwner = req.user && req.user.id === req.params.instructorId;
  const isAdmin  = req.user && req.user.role === 'admin';

  const query = { instructorId: req.params.instructorId };
  if (!isOwner && !isAdmin) {
    query.isPublished = true; // Public only sees published
  }

  const courses = await Course.find(query).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: courses
  });
});
