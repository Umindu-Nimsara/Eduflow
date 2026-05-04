const mongoose = require('mongoose');

// User Points and Level Schema
const userGamificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  // Points System
  totalPoints: {
    type: Number,
    default: 0
  },
  level: {
    type: Number,
    default: 1
  },
  currentLevelPoints: {
    type: Number,
    default: 0
  },
  pointsToNextLevel: {
    type: Number,
    default: 100
  },
  // Rank
  rank: {
    type: String,
    enum: ['Beginner', 'Learner', 'Scholar', 'Expert', 'Master', 'Legend'],
    default: 'Beginner'
  },
  // Badges
  badges: [{
    badgeId: String,
    name: String,
    description: String,
    icon: String,
    earnedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Achievements
  achievements: [{
    achievementId: String,
    name: String,
    description: String,
    points: Number,
    unlockedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Daily Challenges
  dailyChallenges: [{
    challengeId: String,
    name: String,
    description: String,
    target: Number,
    progress: {
      type: Number,
      default: 0
    },
    points: Number,
    completed: {
      type: Boolean,
      default: false
    },
    date: {
      type: Date,
      default: Date.now
    }
  }],
  // Statistics
  stats: {
    lessonsCompleted: {
      type: Number,
      default: 0
    },
    quizzesCompleted: {
      type: Number,
      default: 0
    },
    assignmentsSubmitted: {
      type: Number,
      default: 0
    },
    discussionsCreated: {
      type: Number,
      default: 0
    },
    repliesPosted: {
      type: Number,
      default: 0
    },
    coursesCompleted: {
      type: Number,
      default: 0
    },
    perfectQuizzes: {
      type: Number,
      default: 0
    },
    daysActive: {
      type: Number,
      default: 0
    }
  },
  // Activity History (last 30 days)
  activityHistory: [{
    date: {
      type: Date,
      required: true
    },
    activities: {
      type: Number,
      default: 0
    }
  }],
  // Last activity
  lastActivityDate: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Calculate rank based on level
userGamificationSchema.methods.updateRank = function() {
  if (this.level >= 50) this.rank = 'Legend';
  else if (this.level >= 40) this.rank = 'Master';
  else if (this.level >= 30) this.rank = 'Expert';
  else if (this.level >= 20) this.rank = 'Scholar';
  else if (this.level >= 10) this.rank = 'Learner';
  else this.rank = 'Beginner';
};

// Add points and level up
userGamificationSchema.methods.addPoints = function(points) {
  this.totalPoints += points;
  this.currentLevelPoints += points;

  // Check for level up
  while (this.currentLevelPoints >= this.pointsToNextLevel) {
    this.currentLevelPoints -= this.pointsToNextLevel;
    this.level += 1;
    this.pointsToNextLevel = Math.floor(100 * Math.pow(1.1, this.level - 1));
    this.updateRank();
  }
};

// Track daily activity
userGamificationSchema.methods.trackActivity = function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  // Check if today is already tracked
  const existingActivity = this.activityHistory.find(a => {
    const activityDate = new Date(a.date);
    activityDate.setHours(0, 0, 0, 0);
    return activityDate.toISOString().split('T')[0] === todayStr;
  });

  if (existingActivity) {
    // Increment activity count for today
    existingActivity.activities += 1;
  } else {
    // Add new activity for today
    this.activityHistory.push({
      date: today,
      activities: 1
    });

    // Keep only last 30 days
    if (this.activityHistory.length > 30) {
      this.activityHistory = this.activityHistory
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 30);
    }
  }

  this.lastActivityDate = new Date();
};

// Index for leaderboard queries
userGamificationSchema.index({ totalPoints: -1 });
userGamificationSchema.index({ level: -1 });

module.exports = mongoose.model('UserGamification', userGamificationSchema);
