const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Course ID is required']
  },
  issuedAt: {
    type: Date,
    default: Date.now
  },
  certificateUrl: {
    type: String,
    required: [true, 'Certificate URL is required']
  }
}, {
  timestamps: true
});

// Compound index to ensure unique certificate per user-course
certificateSchema.index({ userId: 1, courseId: 1 }, { unique: true });
certificateSchema.index({ issuedAt: -1 });

module.exports = mongoose.model('Certificate', certificateSchema);
