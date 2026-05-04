const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const User = require('../models/User.model');
const InstructorProfile = require('../models/InstructorProfile.model');
const Course = require('../models/Course.model');
const Enrollment = require('../models/Enrollment.model');
const Feedback = require('../models/Feedback.model');
const { uploadToCloudinary } = require('../config/cloudinary');
const AdminLog = require('../models/AdminLog.model');

// @desc    Get all instructors
// @route   GET /api/instructors
// @access  Public
exports.getAllInstructors = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const instructors = await InstructorProfile.find()
    .populate('userId', 'name email')
    .sort({ rating: -1 })
    .skip(skip)
    .limit(limit);

  const total = await InstructorProfile.countDocuments();

  res.status(200).json({
    success: true,
    data: instructors,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      total,
      limit
    }
  });
});

// @desc    Get instructor by ID
// @route   GET /api/instructors/:id
// @access  Public
exports.getInstructorById = asyncHandler(async (req, res, next) => {
  const instructor = await InstructorProfile.findById(req.params.id)
    .populate('userId', 'name email createdAt');

  if (!instructor) {
    return next(new AppError('Instructor not found', 404));
  }

  res.status(200).json({
    success: true,
    data: instructor
  });
});

// @desc    Register as instructor
// @route   POST /api/instructors/register
// @access  Private
exports.registerInstructor = asyncHandler(async (req, res, next) => {
  const { bio, expertise, socialLinks } = req.body;

  // Check if user already has instructor profile
  const existingProfile = await InstructorProfile.findOne({ userId: req.user.id });
  if (existingProfile) {
    return next(new AppError('You already have an instructor profile', 400));
  }

  // Update user role to instructor
  await User.findByIdAndUpdate(req.user.id, { role: 'instructor' });

  // Create instructor profile
  const instructorProfile = await InstructorProfile.create({
    userId: req.user.id,
    bio,
    expertise: expertise ? expertise.split(',').map(e => e.trim()) : [],
    socialLinks: socialLinks || {}
  });

  res.status(201).json({
    success: true,
    message: 'Instructor profile created successfully',
    data: instructorProfile
  });
});

// @desc    Update instructor profile
// @route   PUT /api/instructors/:id
// @access  Private
exports.updateInstructor = asyncHandler(async (req, res, next) => {
  let instructor = await InstructorProfile.findById(req.params.id);

  if (!instructor) {
    return next(new AppError('Instructor profile not found', 404));
  }

  // Check ownership
  if (instructor.userId.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('You are not authorized to update this profile', 403));
  }

  const { bio, expertise, socialLinks } = req.body;

  instructor = await InstructorProfile.findByIdAndUpdate(
    req.params.id,
    {
      bio,
      expertise: expertise ? expertise.split(',').map(e => e.trim()) : instructor.expertise,
      socialLinks: socialLinks || instructor.socialLinks,
      updatedAt: Date.now()
    },
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    message: 'Instructor profile updated successfully',
    data: instructor
  });
});

// @desc    Delete instructor profile (admin only)
// @route   DELETE /api/instructors/:id
// @access  Private (Admin)
exports.deleteInstructor = asyncHandler(async (req, res, next) => {
  const instructor = await InstructorProfile.findById(req.params.id);

  if (!instructor) {
    return next(new AppError('Instructor profile not found', 404));
  }

  await InstructorProfile.findByIdAndDelete(req.params.id);

  // Log admin action
  await AdminLog.create({
    adminId: req.user.id,
    action: 'Deleted instructor profile',
    targetId: req.params.id,
    targetModel: 'InstructorProfile'
  });

  res.status(200).json({
    success: true,
    message: 'Instructor profile deleted successfully'
  });
});

// @desc    Get current instructor profile
// @route   GET /api/instructors/profile
// @access  Private (Instructor)
exports.getMyProfile = asyncHandler(async (req, res, next) => {
  // Get user data
  const user = await User.findById(req.user.id).select('-password -refreshToken');
  
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Get or create instructor profile
  let instructorProfile = await InstructorProfile.findOne({ userId: req.user.id });
  
  if (!instructorProfile) {
    // Create a basic profile if it doesn't exist
    instructorProfile = await InstructorProfile.create({
      userId: req.user.id
    });
  }

  // Combine user and instructor profile data
  const profileData = {
    _id: instructorProfile._id,
    name: user.name,
    email: user.email,
    bio: instructorProfile.bio || '',
    specialization: instructorProfile.specialization || '',
    qualifications: instructorProfile.qualifications || '',
    experience: instructorProfile.experience || '',
    phone: instructorProfile.phone || '',
    website: instructorProfile.website || '',
    profilePicture: instructorProfile.profilePhoto || '',
    expertise: instructorProfile.expertise || [],
    rating: instructorProfile.rating || 0,
    isVerified: instructorProfile.isVerified || false,
    socialLinks: instructorProfile.socialLinks || {}
  };

  res.status(200).json({
    success: true,
    data: profileData
  });
});

// @desc    Update current instructor profile
// @route   PUT /api/instructors/profile
// @access  Private (Instructor)
exports.updateMyProfile = asyncHandler(async (req, res, next) => {
  const { 
    name, 
    bio, 
    specialization, 
    qualifications, 
    experience, 
    phone, 
    website 
  } = req.body;

  // Update user name if provided
  if (name) {
    await User.findByIdAndUpdate(
      req.user.id, 
      { name: name.trim() },
      { runValidators: true }
    );
  }

  // Get or create instructor profile
  let instructorProfile = await InstructorProfile.findOne({ userId: req.user.id });
  
  if (!instructorProfile) {
    instructorProfile = await InstructorProfile.create({
      userId: req.user.id,
      bio: bio?.trim() || '',
      specialization: specialization?.trim() || '',
      qualifications: qualifications?.trim() || '',
      experience: experience?.trim() || '',
      phone: phone?.trim() || '',
      website: website?.trim() || ''
    });
  } else {
    // Update instructor profile
    instructorProfile.bio = bio?.trim() || instructorProfile.bio;
    instructorProfile.specialization = specialization?.trim() || instructorProfile.specialization;
    instructorProfile.qualifications = qualifications?.trim() || instructorProfile.qualifications;
    instructorProfile.experience = experience?.trim() || instructorProfile.experience;
    instructorProfile.phone = phone?.trim() || instructorProfile.phone;
    instructorProfile.website = website?.trim() || instructorProfile.website;
    instructorProfile.updatedAt = Date.now();
    
    await instructorProfile.save();
  }

  // Get updated user data
  const user = await User.findById(req.user.id).select('-password -refreshToken');

  // Return combined data
  const profileData = {
    _id: instructorProfile._id,
    name: user.name,
    email: user.email,
    bio: instructorProfile.bio,
    specialization: instructorProfile.specialization,
    qualifications: instructorProfile.qualifications,
    experience: instructorProfile.experience,
    phone: instructorProfile.phone,
    website: instructorProfile.website,
    profilePicture: instructorProfile.profilePhoto,
    expertise: instructorProfile.expertise,
    rating: instructorProfile.rating,
    isVerified: instructorProfile.isVerified,
    socialLinks: instructorProfile.socialLinks
  };

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: profileData
  });
});

// @desc    Upload instructor profile photo
// @route   POST /api/instructors/upload-photo
// @access  Private (Instructor)
exports.uploadPhoto = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError('Please upload an image file', 400));
  }

  // Upload to Cloudinary or local storage
  const result = await uploadToCloudinary(
    req.file.buffer, 
    'profiles', 
    'image',
    req.file.originalname
  );

  // Get or create instructor profile
  let instructor = await InstructorProfile.findOne({ userId: req.user.id });

  if (!instructor) {
    instructor = await InstructorProfile.create({
      userId: req.user.id
    });
  }

  const photoUrl = result.secure_url || result.url;
  instructor.profilePhoto = photoUrl;
  await instructor.save();

  res.status(200).json({
    success: true,
    message: 'Profile photo uploaded successfully',
    data: {
      url: photoUrl
    }
  });
});

// @desc    Verify instructor (admin only)
// @route   PUT /api/instructors/:id/verify
// @access  Private (Admin)
exports.verifyInstructor = asyncHandler(async (req, res, next) => {
  const instructor = await InstructorProfile.findById(req.params.id);

  if (!instructor) {
    return next(new AppError('Instructor profile not found', 404));
  }

  instructor.isVerified = true;
  await instructor.save();

  // Log admin action
  await AdminLog.create({
    adminId: req.user.id,
    action: 'Verified instructor',
    targetId: req.params.id,
    targetModel: 'InstructorProfile'
  });

  res.status(200).json({
    success: true,
    message: 'Instructor verified successfully',
    data: instructor
  });
});

// @desc    Get instructor courses
// @route   GET /api/instructors/:id/courses
// @access  Public
exports.getInstructorCourses = asyncHandler(async (req, res, next) => {
  const userId = req.params.id;

  // Find courses by instructorId (which is the user ID)
  const courses = await Course.find({ 
    instructorId: userId
  }).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: courses
  });
});

// @desc    Get instructor statistics
// @route   GET /api/instructors/:id/stats
// @access  Public
exports.getInstructorStats = asyncHandler(async (req, res, next) => {
  const userId = req.params.id;

  // Get total courses
  const totalCourses = await Course.countDocuments({ 
    instructorId: userId 
  });

  // Get total students (unique enrollments)
  const courses = await Course.find({ instructorId: userId }).select('_id');
  const courseIds = courses.map(c => c._id);
  
  const totalStudents = await Enrollment.distinct('userId', { 
    courseId: { $in: courseIds } 
  });

  // Calculate average rating from course feedback
  const feedbacks = await Feedback.find({ 
    courseId: { $in: courseIds },
    isApproved: true 
  });

  const avgRating = feedbacks.length > 0
    ? feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length
    : 0;

  // Get pending submissions count
  const AssignmentSubmission = require('../models/AssignmentSubmission.model');
  const Assignment = require('../models/Assignment.model');
  
  const instructorAssignments = await Assignment.find({ 
    courseId: { $in: courseIds } 
  }).select('_id');
  const assignmentIds = instructorAssignments.map(a => a._id);
  
  const pendingSubmissions = await AssignmentSubmission.countDocuments({
    assignmentId: { $in: assignmentIds },
    status: 'submitted'
  });

  res.status(200).json({
    success: true,
    data: {
      totalCourses,
      totalStudents: totalStudents.length,
      avgRating: Math.round(avgRating * 10) / 10,
      totalRevenue: 0, // TODO: Implement revenue tracking
      pendingSubmissions,
      totalReviews: feedbacks.length
    }
  });
});
