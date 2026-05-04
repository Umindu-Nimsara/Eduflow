const mongoose = require('mongoose');

const assignmentSubmissionSchema = new mongoose.Schema({
  assignmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assignment',
    required: [true, 'Assignment ID is required']
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  submissionUrl: {
    type: String,
    // Not required - can submit with text only
  },
  submissionText: {
    type: String,
    maxlength: [5000, 'Submission text cannot exceed 5000 characters']
  },
  grade: {
    type: Number,
    min: [0, 'Grade cannot be negative']
  },
  feedback: {
    type: String,
    maxlength: [1000, 'Feedback cannot exceed 1000 characters']
  },
  isGraded: {
    type: Boolean,
    default: false
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient querying
assignmentSubmissionSchema.index({ assignmentId: 1, userId: 1 });
assignmentSubmissionSchema.index({ submittedAt: -1 });

module.exports = mongoose.model('AssignmentSubmission', assignmentSubmissionSchema);
