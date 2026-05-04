const mongoose = require('mongoose');

const leaderboardSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  },
  points: {
    type: Number,
    default: 0
  },
  rank: {
    type: Number,
    default: 0
  },
  achievements: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Achievement'
  }],
  streak: {
    current: {
      type: Number,
      default: 0
    },
    longest: {
      type: Number,
      default: 0
    },
    lastActivity: Date
  },
  stats: {
    quizzesCompleted: {
      type: Number,
      default: 0
    },
    assignmentsSubmitted: {
      type: Number,
      default: 0
    },
    lessonsCompleted: {
      type: Number,
      default: 0
    },
    forumPosts: {
      type: Number,
      default: 0
    },
    helpfulReplies: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

leaderboardSchema.index({ courseId: 1, points: -1 });
leaderboardSchema.index({ userId: 1, courseId: 1 }, { unique: true });

module.exports = mongoose.model('Leaderboard', leaderboardSchema);
