const mongoose = require('mongoose');

const peerReviewSchema = new mongoose.Schema({
  assignmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assignment',
    required: true
  },
  submissionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AssignmentSubmission',
    required: true
  },
  reviewerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  revieweeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  criteria: [{
    name: {
      type: String,
      required: true
    },
    description: String,
    maxScore: {
      type: Number,
      required: true
    },
    score: {
      type: Number,
      required: true
    },
    feedback: String
  }],
  overallScore: {
    type: Number,
    required: true
  },
  strengths: {
    type: String,
    trim: true
  },
  improvements: {
    type: String,
    trim: true
  },
  additionalComments: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'submitted', 'approved', 'rejected'],
    default: 'pending'
  },
  isAnonymous: {
    type: Boolean,
    default: true
  },
  submittedAt: Date,
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date
}, {
  timestamps: true
});

// Index for efficient querying
peerReviewSchema.index({ assignmentId: 1 });
peerReviewSchema.index({ submissionId: 1 });
peerReviewSchema.index({ reviewerId: 1 });
peerReviewSchema.index({ revieweeId: 1 });

module.exports = mongoose.model('PeerReview', peerReviewSchema);
