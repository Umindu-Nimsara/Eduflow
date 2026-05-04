const express = require('express');
const router = express.Router();
const {
  createForumPost,
  getForumPosts,
  getForumPost,
  addReply,
  togglePin,
  toggleLock,
  deleteForumPost
} = require('../controllers/forum.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');

router.use(protect);

router.post('/', createForumPost);
router.get('/course/:courseId', getForumPosts);
router.get('/:id', getForumPost);
router.post('/:id/reply', addReply);
router.put('/:id/pin', restrictTo('instructor', 'admin'), togglePin);
router.put('/:id/lock', restrictTo('instructor', 'admin'), toggleLock);
router.delete('/:id', deleteForumPost);

module.exports = router;


