const mongoose = require('mongoose');

const collaborativeProjectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  teamMembers: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['leader', 'member'],
      default: 'member'
    },
    contribution: {
      type: Number,
      default: 0
    }
  }],
  dueDate: Date,
  status: {
    type: String,
    enum: ['planning', 'in-progress', 'review', 'completed'],
    default: 'planning'
  },
  tasks: [{
    title: String,
    description: String,
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['todo', 'in-progress', 'done'],
      default: 'todo'
    },
    dueDate: Date
  }],
  files: [{
    name: String,
    url: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  grade: Number,
  feedback: String
}, {
  timestamps: true
});

collaborativeProjectSchema.index({ courseId: 1 });
collaborativeProjectSchema.index({ 'teamMembers.userId': 1 });

module.exports = mongoose.model('CollaborativeProject', collaborativeProjectSchema);
