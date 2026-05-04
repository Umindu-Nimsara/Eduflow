const mongoose = require('mongoose');

const streakSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    unique: true
  },
  currentStreak: {
    type: Number,
    default: 0,
    min: [0, 'Current streak cannot be negative']
  },
  longestStreak: {
    type: Number,
    default: 0,
    min: [0, 'Longest streak cannot be negative']
  },
  lastActivityDate: {
    type: Date,
    default: Date.now
  },
  totalActiveDays: {
    type: Number,
    default: 0,
    min: [0, 'Total active days cannot be negative']
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient querying
streakSchema.index({ userId: 1 });

module.exports = mongoose.model('Streak', streakSchema);
