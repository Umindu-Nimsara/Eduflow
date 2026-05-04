const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect, restrictTo } = require('../middleware/auth.middleware');
const { uploadDocument } = require('../config/cloudinary');
const {
  getDiscussionsByCourse,
  getDiscussionById,
  createDiscussion,
  updateDiscussion,
  deleteDiscussion,
  likeDiscussion,
  pinDiscussion,
  uploadAttachment,
  getAllDiscussions,
  addReply,
  getReplies,
  updateReply,
  deleteReply,
  likeReply
} = require('../controllers/discussion.controller');

const router = express.Router();

// Validation rules
const discussionValidation = [
  body('courseId')
    .notEmpty().withMessage('Course ID is required')
    .isMongoId().withMessage('Invalid course ID'),
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ max: 200 }).withMessage('Title cannot exceed 200 characters'),
  body('content')
    .trim()
    .notEmpty().withMessage('Content is required')
    .isLength({ max: 5000 }).withMessage('Content cannot exceed 5000 characters'),
  body('attachment')
    .optional()
    .trim()
];

// Routes
router.get('/admin/all', protect, restrictTo('admin'), getAllDiscussions);
router.get('/course/:courseId', getDiscussionsByCourse);

// Reply routes (must come before /:id to avoid conflicts)
router.post('/:id/reply', protect, addReply);
router.get('/:id/replies', getReplies);
router.put('/reply/:replyId', protect, updateReply);
router.delete('/reply/:replyId', protect, deleteReply);
router.post('/reply/:replyId/like', protect, likeReply);

// Discussion routes
router.get('/:id', getDiscussionById);
router.post('/', protect, discussionValidation, validate, createDiscussion);
router.put('/:id', protect, updateDiscussion);
router.delete('/:id', protect, deleteDiscussion);
router.post('/:id/like', protect, likeDiscussion);
router.put('/:id/pin', protect, restrictTo('instructor', 'admin'), pinDiscussion);
router.post('/upload', protect, uploadDocument.single('attachment'), uploadAttachment);

module.exports = router;
