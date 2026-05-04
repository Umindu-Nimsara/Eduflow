const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const UploadedFile = require('../models/UploadedFile.model');
const { uploadToCloudinary } = require('../config/cloudinary');

// @desc    Save file metadata after upload
// @route   POST /api/files/save-metadata
// @access  Private
exports.saveFileMetadata = asyncHandler(async (req, res, next) => {
  const {
    url,
    publicId,
    type,
    resourceType,
    format,
    size,
    width,
    height,
    duration,
    originalFilename,
    folder,
    tags,
  } = req.body;

  if (!url || !type) {
    return next(new AppError('URL and type are required', 400));
  }

  const file = await UploadedFile.create({
    url,
    publicId,
    type,
    resourceType,
    format,
    size,
    width,
    height,
    duration,
    originalFilename,
    uploadedBy: req.user?.id,
    folder,
    tags,
  });

  res.status(201).json({
    success: true,
    message: 'File metadata saved successfully',
    data: file,
  });
});

// @desc    Get all uploaded files
// @route   GET /api/files
// @access  Private
exports.getAllFiles = asyncHandler(async (req, res, next) => {
  const { type, folder, page = 1, limit = 20 } = req.query;
  
  const query = {};
  
  // Filter by type if provided
  if (type) {
    query.type = type;
  }
  
  // Filter by folder if provided
  if (folder) {
    query.folder = folder;
  }
  
  // If not admin, only show user's own files
  if (req.user.role !== 'admin') {
    query.uploadedBy = req.user.id;
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const files = await UploadedFile.find(query)
    .populate('uploadedBy', 'name email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await UploadedFile.countDocuments(query);

  res.status(200).json({
    success: true,
    data: files,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      total,
      limit: parseInt(limit),
    },
  });
});

// @desc    Get file by ID
// @route   GET /api/files/:id
// @access  Private
exports.getFileById = asyncHandler(async (req, res, next) => {
  const file = await UploadedFile.findById(req.params.id)
    .populate('uploadedBy', 'name email');

  if (!file) {
    return next(new AppError('File not found', 404));
  }

  res.status(200).json({
    success: true,
    data: file,
  });
});

// @desc    Delete file
// @route   DELETE /api/files/:id
// @access  Private
exports.deleteFile = asyncHandler(async (req, res, next) => {
  const file = await UploadedFile.findById(req.params.id);

  if (!file) {
    return next(new AppError('File not found', 404));
  }

  // Check ownership (users can only delete their own files, unless admin)
  if (file.uploadedBy?.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('You are not authorized to delete this file', 403));
  }

  // Delete from Cloudinary if publicId exists
  if (file.publicId) {
    try {
      const cloudinary = require('cloudinary').v2;
      await cloudinary.uploader.destroy(file.publicId, {
        resource_type: file.resourceType || 'image',
      });
    } catch (err) {
      console.error('Cloudinary delete error:', err);
      // Continue even if Cloudinary delete fails
    }
  }

  await UploadedFile.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: 'File deleted successfully',
  });
});

// @desc    Upload file directly (alternative to frontend upload)
// @route   POST /api/files/upload
// @access  Private
exports.uploadFile = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError('Please upload a file', 400));
  }

  const { folder = 'general', tags } = req.body;

  // Determine resource type
  let resourceType = 'raw';
  let fileType = 'other';
  
  if (req.file.mimetype.startsWith('image/')) {
    resourceType = 'image';
    fileType = 'image';
  } else if (req.file.mimetype.startsWith('video/')) {
    resourceType = 'video';
    fileType = 'video';
  } else if (req.file.mimetype === 'application/pdf') {
    resourceType = 'raw';
    fileType = 'pdf';
  } else if (req.file.mimetype.includes('document') || req.file.mimetype.includes('word')) {
    resourceType = 'raw';
    fileType = 'document';
  }

  // Upload to Cloudinary
  const result = await uploadToCloudinary(
    req.file.buffer,
    folder,
    resourceType,
    req.file.originalname
  );

  // Save metadata to database
  const file = await UploadedFile.create({
    url: result.secure_url || result.url,
    publicId: result.public_id,
    type: fileType,
    resourceType,
    format: result.format,
    size: result.bytes,
    width: result.width,
    height: result.height,
    duration: result.duration,
    originalFilename: req.file.originalname,
    uploadedBy: req.user.id,
    folder,
    tags: tags ? tags.split(',').map(t => t.trim()) : [],
  });

  res.status(201).json({
    success: true,
    message: 'File uploaded successfully',
    data: file,
  });
});

// @desc    Get Cloudinary config for frontend
// @route   GET /api/files/cloudinary-config
// @access  Public
exports.getCloudinaryConfig = asyncHandler(async (req, res, next) => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  res.status(200).json({
    success: true,
    data: {
      cloudName: cloudName,
      uploadPreset: process.env.CLOUDINARY_UPLOAD_PRESET || 'EDUFLOW',
      apiUrl: `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
      videoUrl: `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`,
      imageUrl: `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      rawUrl: `https://api.cloudinary.com/v1_1/${cloudName}/raw/upload`,
    },
  });
});
