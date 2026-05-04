const jwt = require('jsonwebtoken');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const User = require('../models/User.model');
const UserProfile = require('../models/UserProfile.model');
const Streak = require('../models/Streak.model');

// Token blacklist (in production, use Redis)
const tokenBlacklist = new Set();

// Generate access token
const generateAccessToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRE || '15m'
  });
};

// Generate refresh token
const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d'
  });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res, next) => {
  const { name, email, mobile, password, role } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new AppError('User with this email already exists', 400));
  }

  // Create user
  const user = await User.create({
    name,
    email,
    mobile: mobile || '',
    password,
    role: role || 'student'
  });

  // Create user profile
  await UserProfile.create({
    userId: user._id
  });

  // Create streak record
  await Streak.create({
    userId: user._id
  });

  // Generate tokens
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  // Save refresh token to database
  user.refreshToken = refreshToken;
  await user.save();

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        profilePhoto: user.profilePhoto,
        role: user.role,
        createdAt: user.createdAt
      },
      accessToken,
      refreshToken
    }
  });
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Check if email and password provided
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  // Find user and include password field
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return next(new AppError('Invalid email or password', 401));
  }

  // Check if password matches
  const isPasswordCorrect = await user.comparePassword(password);

  if (!isPasswordCorrect) {
    return next(new AppError('Invalid email or password', 401));
  }

  // Update streak on login
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const streak = await Streak.findOne({ userId: user._id });
  if (streak) {
    const lastActivity = new Date(streak.lastActivityDate);
    lastActivity.setHours(0, 0, 0, 0);

    const daysDiff = Math.floor((today - lastActivity) / (1000 * 60 * 60 * 24));

    if (daysDiff === 1) {
      // Consecutive day
      streak.currentStreak += 1;
      streak.totalActiveDays += 1;
      if (streak.currentStreak > streak.longestStreak) {
        streak.longestStreak = streak.currentStreak;
      }
    } else if (daysDiff > 1) {
      // Streak broken
      streak.currentStreak = 1;
      streak.totalActiveDays += 1;
    }
    // If daysDiff === 0, same day login, no change

    streak.lastActivityDate = new Date();
    await streak.save();
  }

  // Generate tokens
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  // Save refresh token to database
  user.refreshToken = refreshToken;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        profilePhoto: user.profilePhoto,
        role: user.role,
        createdAt: user.createdAt
      },
      accessToken,
      refreshToken
    }
  });
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
exports.logout = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('+refreshToken');

  if (user && user.refreshToken) {
    // Add refresh token to blacklist
    tokenBlacklist.add(user.refreshToken);

    // Remove refresh token from database
    user.refreshToken = undefined;
    await user.save();
  }

  res.status(200).json({
    success: true,
    message: 'Logout successful'
  });
});

// @desc    Refresh access token
// @route   POST /api/auth/refresh-token
// @access  Public
exports.refreshToken = asyncHandler(async (req, res, next) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return next(new AppError('Refresh token is required', 400));
  }

  // Check if token is blacklisted
  if (tokenBlacklist.has(refreshToken)) {
    return next(new AppError('Invalid refresh token', 401));
  }

  // Verify refresh token
  const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

  // Find user and check if refresh token matches
  const user = await User.findById(decoded.id).select('+refreshToken');

  if (!user || user.refreshToken !== refreshToken) {
    return next(new AppError('Invalid refresh token', 401));
  }

  // Generate new access token
  const newAccessToken = generateAccessToken(user._id);

  res.status(200).json({
    success: true,
    message: 'Token refreshed successfully',
    data: {
      accessToken: newAccessToken
    }
  });
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        profilePhoto: user.profilePhoto,
        bio: user.bio,
        department: user.department,
        qualifications: user.qualifications,
        experience: user.experience,
        officeLocation: user.officeLocation,
        role: user.role,
        twoFactorEnabled: user.twoFactorEnabled,
        createdAt: user.createdAt
      }
    }
  });
});
// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
exports.changePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  // Validation
  if (!currentPassword || !newPassword || !confirmPassword) {
    return next(new AppError('Please provide current password, new password, and confirm password', 400));
  }

  if (newPassword !== confirmPassword) {
    return next(new AppError('New password and confirm password do not match', 400));
  }

  if (newPassword.length < 6) {
    return next(new AppError('New password must be at least 6 characters', 400));
  }

  // Get user with password
  const user = await User.findById(req.user.id).select('+password');

  // Check current password
  const isCurrentPasswordCorrect = await user.comparePassword(currentPassword);
  if (!isCurrentPasswordCorrect) {
    return next(new AppError('Current password is incorrect', 400));
  }

  // Update password
  user.password = newPassword;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Password changed successfully'
  });
});

// @desc    Update profile (name, mobile, professional details)
// @route   PUT /api/auth/update-profile
// @access  Private
exports.updateProfile = asyncHandler(async (req, res, next) => {
  const { name, mobile, bio, department, qualifications, experience, officeLocation } = req.body;

  const updateData = {};
  if (name) updateData.name = name.trim();
  if (mobile !== undefined) updateData.mobile = mobile.trim();
  
  // Professional fields (for admin)
  if (bio !== undefined) updateData.bio = bio.trim();
  if (department !== undefined) updateData.department = department.trim();
  if (qualifications !== undefined) updateData.qualifications = qualifications.trim();
  if (experience !== undefined) updateData.experience = experience.trim();
  if (officeLocation !== undefined) updateData.officeLocation = officeLocation.trim();

  // Validate mobile number if provided
  if (mobile && mobile.trim() && !/^[0-9]{10,15}$/.test(mobile.trim())) {
    return next(new AppError('Please provide a valid mobile number (10-15 digits)', 400));
  }

  const user = await User.findByIdAndUpdate(
    req.user.id,
    updateData,
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        profilePhoto: user.profilePhoto,
        bio: user.bio,
        department: user.department,
        qualifications: user.qualifications,
        experience: user.experience,
        officeLocation: user.officeLocation,
        role: user.role,
        twoFactorEnabled: user.twoFactorEnabled,
        createdAt: user.createdAt
      }
    }
  });
});

// @desc    Upload profile photo
// @route   PUT /api/auth/upload-photo
// @access  Private
exports.uploadProfilePhoto = asyncHandler(async (req, res, next) => {
  const { photoUrl } = req.body;

  if (!photoUrl) {
    return next(new AppError('Photo URL is required', 400));
  }

  const user = await User.findByIdAndUpdate(
    req.user.id,
    { profilePhoto: photoUrl },
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    message: 'Profile photo updated successfully',
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        profilePhoto: user.profilePhoto,
        role: user.role,
        createdAt: user.createdAt
      }
    }
  });
});

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const { identifier } = req.body; // Can be email or mobile

  if (!identifier) {
    return next(new AppError('Please provide email address or mobile number', 400));
  }

  let user;
  
  // Check if identifier is email or mobile
  if (identifier.includes('@')) {
    // It's an email
    user = await User.findOne({ email: identifier.toLowerCase() });
    if (!user) {
      return next(new AppError('No user found with that email address', 404));
    }
  } else {
    // It's a mobile number
    const cleanMobile = identifier.replace(/\D/g, ''); // Remove non-digits
    if (cleanMobile.length < 10 || cleanMobile.length > 15) {
      return next(new AppError('Please provide a valid mobile number (10-15 digits)', 400));
    }
    
    user = await User.findOne({ mobile: cleanMobile });
    if (!user) {
      return next(new AppError('No user found with that mobile number', 404));
    }
  }

  // Generate reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // In a real app, you would send SMS/email here
  res.status(200).json({
    success: true,
    message: `Reset code sent to your ${identifier.includes('@') ? 'email' : 'mobile number'}.`,
    data: {
      identifier: identifier.includes('@') ? user.email : user.mobile,
      type: identifier.includes('@') ? 'email' : 'mobile'
    }
  });
});

// @desc    Get reset token for development/testing
// @route   POST /api/auth/get-reset-token
// @access  Public (Development only)
exports.getResetToken = asyncHandler(async (req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    return next(new AppError('This endpoint is not available in production', 403));
  }

  const { identifier } = req.body;

  if (!identifier) {
    return next(new AppError('Please provide email address or mobile number', 400));
  }

  let user;
  
  // Check if identifier is email or mobile
  if (identifier.includes('@')) {
    user = await User.findOne({ email: identifier.toLowerCase() });
  } else {
    const cleanMobile = identifier.replace(/\D/g, '');
    user = await User.findOne({ mobile: cleanMobile });
  }

  if (!user) {
    return next(new AppError('No user found with that identifier', 404));
  }

  // Find existing reset token
  if (!user.passwordResetToken || !user.passwordResetExpires || user.passwordResetExpires < Date.now()) {
    return next(new AppError('No valid reset token found. Please request a new one.', 400));
  }

  // Return the plain token (development only)
  const crypto = require('crypto');
  
  // We need to find the original token by checking all possible tokens
  // This is a simplified approach for development
  res.status(200).json({
    success: true,
    message: 'Reset token retrieved (Development only)',
    data: {
      message: 'Check your email/SMS for the reset token, or use the development endpoint to get it.',
      identifier: identifier.includes('@') ? user.email : user.mobile,
      type: identifier.includes('@') ? 'email' : 'mobile'
    }
  });
});

// @desc    Reset password
// @route   POST /api/auth/reset-password/:token
// @access  Public
exports.resetPassword = asyncHandler(async (req, res, next) => {
  const { newPassword, confirmPassword } = req.body;
  const { token } = req.params;

  if (!newPassword || !confirmPassword) {
    return next(new AppError('Please provide new password and confirm password', 400));
  }

  if (newPassword !== confirmPassword) {
    return next(new AppError('Passwords do not match', 400));
  }

  if (newPassword.length < 6) {
    return next(new AppError('Password must be at least 6 characters', 400));
  }

  // Hash token and find user
  const hashedToken = require('crypto')
    .createHash('sha256')
    .update(token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }

  // Set new password
  user.password = newPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Password reset successful. You can now login with your new password.'
  });
});


// @desc    Enable Two-Factor Authentication
// @route   POST /api/auth/enable-2fa
// @access  Private (Admin only)
exports.enable2FA = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Only admin can enable 2FA
  if (user.role !== 'admin') {
    return next(new AppError('Two-Factor Authentication is only available for admin accounts', 403));
  }

  // Enable 2FA
  user.twoFactorEnabled = true;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Two-Factor Authentication has been enabled successfully'
  });
});

// @desc    Disable Two-Factor Authentication
// @route   POST /api/auth/disable-2fa
// @access  Private (Admin only)
exports.disable2FA = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Only admin can disable 2FA
  if (user.role !== 'admin') {
    return next(new AppError('Unauthorized', 403));
  }

  // Disable 2FA
  user.twoFactorEnabled = false;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Two-Factor Authentication has been disabled'
  });
});
