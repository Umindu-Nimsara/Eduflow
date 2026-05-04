const mongoose = require('mongoose');

const liveClassSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Please add a class title'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  scheduledDate: {
    type: Date,
    required: true
  },
  duration: {
    type: Number, // in minutes
    required: true,
    default: 60
  },
  meetingLink: {
    type: String,
    trim: true
  },
  meetingId: {
    type: String,
    trim: true
  },
  meetingPassword: {
    type: String,
    trim: true
  },
  platform: {
    type: String,
    enum: ['zoom', 'google-meet', 'microsoft-teams', 'other'],
    default: 'zoom'
  },
  status: {
    type: String,
    enum: ['scheduled', 'live', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  instructorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  maxParticipants: {
    type: Number,
    default: 100
  },
  recordingUrl: {
    type: String,
    trim: true
  },
  isRecorded: {
    type: Boolean,
    default: false
  },
  attendees: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    joinedAt: Date,
    leftAt: Date,
    duration: Number // in minutes
  }],
  reminders: [{
    type: {
      type: String,
      enum: ['email', 'push', 'both'],
      default: 'both'
    },
    minutesBefore: {
      type: Number,
      default: 30
    },
    sent: {
      type: Boolean,
      default: false
    }
  }]
}, {
  timestamps: true
});

// Index for efficient querying
liveClassSchema.index({ courseId: 1, scheduledDate: -1 });
liveClassSchema.index({ instructorId: 1 });
liveClassSchema.index({ status: 1 });

module.exports = mongoose.model('LiveClass', liveClassSchema);
