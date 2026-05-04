const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const User = require('../models/User.model');
const UserProfile = require('../models/UserProfile.model');
const { uploadToCloudinary } = require('../config/cloudinary');
const AdminLog = require('../models/AdminLog.model');

// @desc    Get all users (admin only)
// @route   GET /api/users
// @access  Private (Admin)
exports.getAllUsers = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const users = await User.find()
    .select('-password -refreshToken')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await User.countDocuments();

  // Log admin action
  await AdminLog.create({
    adminId: req.user.id,
    action: 'Viewed all users',
    targetModel: 'User'
  });

  res.status(200).json({
    success: true,
    data: users,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      total,
      limit
    }
  });
});

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private
exports.getUserById = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id).select('-password -refreshToken');

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  const profile = await UserProfile.findOne({ userId: req.params.id })
    .populate('enrolledCourses', 'title thumbnail');

  res.status(200).json({
    success: true,
    data: {
      user,
      profile
    }
  });
});

// @desc    Update user profile
// @route   PUT /api/users/:id
// @access  Private
exports.updateUser = asyncHandler(async (req, res, next) => {
  // Users can only update their own profile, unless admin
  if (req.params.id !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('You are not authorized to update this profile', 403));
  }

  const { name, phone, address, dateOfBirth, role, isSuspended } = req.body;

  // Only admin can change role or suspend
  if ((role || isSuspended !== undefined) && req.user.role !== 'admin') {
    return next(new AppError('Only admins can change roles or suspend users', 403));
  }

  // Update user fields
  const userUpdates = {};
  if (name) userUpdates.name = name;
  if (role) userUpdates.role = role;
  if (isSuspended !== undefined) userUpdates.isSuspended = isSuspended;

  if (Object.keys(userUpdates).length > 0) {
    await User.findByIdAndUpdate(req.params.id, userUpdates, { runValidators: true });
  }

  // Update or create user profile
  let profile = await UserProfile.findOne({ userId: req.params.id });

  if (!profile) {
    profile = await UserProfile.create({
      userId: req.params.id,
      phone,
      address,
      dateOfBirth
    });
  } else {
    profile = await UserProfile.findOneAndUpdate(
      { userId: req.params.id },
      { phone, address, dateOfBirth, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );
  }

  const user = await User.findById(req.params.id).select('-password -refreshToken');

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      user,
      profile
    }
  });
});

// @desc    Delete user (admin only)
// @route   DELETE /api/users/:id
// @access  Private (Admin)
exports.deleteUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Delete user profile
  await UserProfile.findOneAndDelete({ userId: req.params.id });

  // Delete user
  await User.findByIdAndDelete(req.params.id);

  // Log admin action
  await AdminLog.create({
    adminId: req.user.id,
    action: 'Deleted user',
    targetId: req.params.id,
    targetModel: 'User'
  });

  res.status(200).json({
    success: true,
    message: 'User deleted successfully'
  });
});

// @desc    Upload profile photo
// @route   POST /api/users/upload-photo
// @access  Private
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

  // Update user profile
  let profile = await UserProfile.findOne({ userId: req.user.id });
  const photoUrl = result.secure_url || result.url;

  if (!profile) {
    profile = await UserProfile.create({
      userId: req.user.id,
      profilePhoto: photoUrl
    });
  } else {
    profile.profilePhoto = photoUrl;
    await profile.save();
  }

  res.status(200).json({
    success: true,
    message: 'Profile photo uploaded successfully',
    data: {
      url: photoUrl
    }
  });
});
