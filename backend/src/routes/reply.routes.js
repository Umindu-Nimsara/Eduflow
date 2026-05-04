const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth.middleware');
const {
  getRepliesByDiscussion,
  createReply,
  updateReply,
  deleteReply,
  likeReply
} = require('../controllers/reply.controller');

const router = express.Router();

// Validation rules
const replyValidation = [
  body('discussionId')
    .notEmpty().withMessage('Discussion ID is required')
    .isMongoId().withMessage('Invalid discussion ID'),
  body('content')
    .trim()
    .notEmpty().withMessage('Content is required')
    .isLength({ max: 2000 }).withMessage('Content cannot exceed 2000 characters')
];

// Routes
router.get('/discussion/:discussionId', getRepliesByDiscussion);
router.post('/', protect, replyValidation, validate, createReply);
router.put('/:id', protect, updateReply);
router.delete('/:id', protect, deleteReply);
router.post('/:id/like', protect, likeReply);

module.exports = router;
