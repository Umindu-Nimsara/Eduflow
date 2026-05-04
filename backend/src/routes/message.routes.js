const express = require('express');
const router = express.Router();
const {
  sendMessage,
  getMessageThread,
  getConversations,
  markAsRead,
  deleteMessage
} = require('../controllers/message.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

router.post('/', sendMessage);
router.get('/conversations', getConversations);
router.get('/:userId', getMessageThread);
router.put('/:messageId/read', markAsRead);
router.delete('/:messageId', deleteMessage);

module.exports = router;
