const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator ID is required']
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  content: {
    type: String,
    required: [true, 'Content is required'],
    maxlength: [2000, 'Content cannot exceed 2000 characters']
  },
  targetRole: {
    type: String,
    enum: ['all', 'student', 'instructor'],
    default: 'all'
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient querying
announcementSchema.index({ isActive: 1, createdAt: -1 });
announcementSchema.index({ targetRole: 1, isActive: 1 });

module.exports = mongoose.model('Announcement', announcementSchema);
