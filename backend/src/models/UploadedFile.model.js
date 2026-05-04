const mongoose = require('mongoose');

const uploadedFileSchema = new mongoose.Schema({
  url: {
    type: String,
    required: [true, 'File URL is required'],
  },
  publicId: {
    type: String,
    required: false,
  },
  type: {
    type: String,
    enum: ['image', 'video', 'pdf', 'document', 'other'],
    required: [true, 'File type is required'],
  },
  resourceType: {
    type: String,
    enum: ['image', 'video', 'raw'],
    default: 'image',
  },
  format: {
    type: String, // jpg, png, mp4, pdf, etc.
  },
  size: {
    type: Number, // in bytes
  },
  width: {
    type: Number, // for images/videos
  },
  height: {
    type: Number, // for images/videos
  },
  duration: {
    type: Number, // for videos (in seconds)
  },
  originalFilename: {
    type: String,
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
  },
  folder: {
    type: String, // courses, lessons, profiles, etc.
  },
  tags: [{
    type: String,
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for faster queries
uploadedFileSchema.index({ type: 1, createdAt: -1 });
uploadedFileSchema.index({ uploadedBy: 1 });
uploadedFileSchema.index({ folder: 1 });

module.exports = mongoose.model('UploadedFile', uploadedFileSchema);
