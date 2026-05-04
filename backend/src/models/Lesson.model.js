const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Course ID is required']
  },
  title: {
    type: String,
    required: [true, 'Lesson title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  videoUrl: {
    type: String,
    default: ''   // Not required - can use file upload or URL
  },
  pdfUrl: {
    type: String,
    default: ''   // Optional PDF/document attachment
  },
  duration: {
    type: Number,
    default: 0,
    min: [0, 'Duration cannot be negative']
  },
  orderIndex: {
    type: Number,
    default: 0,
    min: [0, 'Order index cannot be negative']
  },
  module: {
    type: String,
    default: '',
    trim: true,
    maxlength: [100, 'Module name cannot exceed 100 characters']
  },
  description: {
    type: String,
    maxlength: [2000, 'Description cannot exceed 2000 characters'],
    default: ''
  },
  resources: [{
    type: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

lessonSchema.index({ courseId: 1, orderIndex: 1 });

module.exports = mongoose.model('Lesson', lessonSchema);
