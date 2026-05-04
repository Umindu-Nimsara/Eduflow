const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: [true, 'Quiz ID is required']
  },
  questionText: {
    type: String,
    required: [true, 'Question text is required'],
    trim: true
  },
  options: [{
    type: String,
    required: [true, 'Options are required']
  }],
  correctAnswer: {
    type: Number,
    required: [true, 'Correct answer index is required'],
    min: [0, 'Correct answer index cannot be negative']
  },
  marks: {
    type: Number,
    required: [true, 'Marks is required'],
    min: [0, 'Marks cannot be negative']
  },
  explanation: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Validate that correctAnswer is within options array bounds
questionSchema.pre('save', function(next) {
  if (this.correctAnswer >= this.options.length) {
    return next(new Error('Correct answer index is out of bounds'));
  }
  next();
});

// Index for efficient querying
questionSchema.index({ quizId: 1 });

module.exports = mongoose.model('Question', questionSchema);
