const mongoose = require('mongoose');

const wellnessCheckSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  stressLevel: {
    type: Number,
    min: 1,
    max: 10,
    required: true
  },
  mood: {
    type: String,
    enum: ['excellent', 'good', 'okay', 'bad', 'terrible'],
    required: true
  },
  sleepHours: {
    type: Number,
    min: 0,
    max: 24
  },
  studyHours: {
    type: Number,
    min: 0,
    max: 24
  },
  factors: [{
    type: String,
    enum: ['exams', 'assignments', 'personal', 'health', 'family', 'social', 'other']
  }],
  notes: {
    type: String,
    trim: true
  },
  needsSupport: {
    type: Boolean,
    default: false
  },
  supportProvided: {
    type: Boolean,
    default: false
  },
  supportNotes: String
}, {
  timestamps: true
});

wellnessCheckSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('WellnessCheck', wellnessCheckSchema);
