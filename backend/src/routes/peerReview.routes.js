const express = require('express');
const router = express.Router();
const {
  createPeerReview,
  getPeerReviewsBySubmission,
  getPeerReviewsByAssignment,
  approvePeerReview,
  getMyReviews,
  getReceivedReviews
} = require('../controllers/peerReview.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');

router.use(protect);

router.post('/', createPeerReview);
router.get('/my-reviews', getMyReviews);
router.get('/received', getReceivedReviews);
router.get('/submission/:submissionId', getPeerReviewsBySubmission);
router.get('/assignment/:assignmentId', restrictTo('instructor', 'admin'), getPeerReviewsByAssignment);
router.put('/:id/approve', restrictTo('instructor', 'admin'), approvePeerReview);

module.exports = router;


