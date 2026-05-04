const mongoose = require('mongoose');

const practiceTestSchema = new mongoose.Schema({
  title: {
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
  questions: [{
    questionText: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['multiple-choice', 'true-false', 'short-answer'],
      default: 'multiple-choice'
    },
    options: [String],
    correctAnswer: {
      type: String,
      required: true
    },
    explanation: String,
    points: {
      type: Number,
      default: 1
    }
  }],
  duration: {
    type: Number,
    default: 60
  },
  totalMarks: {
    type: Number,
    required: true
  },
  passingScore: {
    type: Number,
    default: 50
  },
  attempts: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    score: Number,
    totalMarks: Number,
    percentage: Number,
    answers: [{
      questionIndex: Number,
      answer: String,
      isCorrect: Boolean
    }],
    startedAt: Date,
    completedAt: Date,
    timeTaken: Number
  }]
}, {
  timestamps: true
});

practiceTestSchema.index({ courseId: 1 });

module.exports = mongoose.model('PracticeTest', practiceTestSchema);
