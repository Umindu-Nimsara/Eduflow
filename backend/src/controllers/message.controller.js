const Message = require('../models/Message.model');
const User = require('../models/User.model');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

// @desc    Send a message
// @route   POST /api/messages
// @access  Private
exports.sendMessage = asyncHandler(async (req, res, next) => {
  const { recipientId, message, courseId } = req.body;

  if (!recipientId || !message) {
    return next(new AppError('Recipient and message are required', 400));
  }

  // Check if recipient exists
  const recipient = await User.findById(recipientId);
  if (!recipient) {
    return next(new AppError('Recipient not found', 404));
  }

  const newMessage = await Message.create({
    senderId: req.user._id,
    recipientId,
    message,
    courseId: courseId || null
  });

  await newMessage.populate('senderId', 'name email profilePicture');
  await newMessage.populate('recipientId', 'name email profilePicture');

  res.status(201).json({
    success: true,
    data: newMessage
  });
});

// @desc    Get message thread with a user
// @route   GET /api/messages/:userId
// @access  Private
exports.getMessageThread = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;

  const messages = await Message.find({
    $or: [
      { senderId: req.user._id, recipientId: userId },
      { senderId: userId, recipientId: req.user._id }
    ]
  })
    .populate('senderId', 'name email profilePicture')
    .populate('recipientId', 'name email profilePicture')
    .sort({ createdAt: 1 });

  // Mark messages as read
  await Message.updateMany(
    {
      senderId: userId,
      recipientId: req.user._id,
      read: false
    },
    {
      read: true,
      readAt: new Date()
    }
  );

  res.status(200).json({
    success: true,
    count: messages.length,
    data: messages
  });
});

// @desc    Get all conversations
// @route   GET /api/messages/conversations
// @access  Private
exports.getConversations = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;

  console.log('Getting conversations for user:', userId);

  // Get all unique users the current user has messaged with
  const messages = await Message.find({
    $or: [
      { senderId: userId },
      { recipientId: userId }
    ]
  })
    .populate('senderId', 'name email profilePicture')
    .populate('recipientId', 'name email profilePicture')
    .sort({ createdAt: -1 });

  console.log('Found messages:', messages.length);

  // Group by conversation partner
  const conversationsMap = new Map();

  messages.forEach(msg => {
    const partnerId = msg.senderId._id.toString() === userId.toString()
      ? msg.recipientId._id.toString()
      : msg.senderId._id.toString();

    if (!conversationsMap.has(partnerId)) {
      const partner = msg.senderId._id.toString() === userId.toString()
        ? msg.recipientId
        : msg.senderId;

      conversationsMap.set(partnerId, {
        user: partner,
        lastMessage: msg.message,
        lastMessageTime: msg.createdAt,
        unreadCount: 0
      });
    }
  });

  console.log('Conversations map size:', conversationsMap.size);

  // Count unread messages for each conversation
  for (const [partnerId, conversation] of conversationsMap) {
    const unreadCount = await Message.countDocuments({
      senderId: partnerId,
      recipientId: userId,
      read: false
    });
    conversation.unreadCount = unreadCount;
  }

  const conversations = Array.from(conversationsMap.values());

  console.log('Returning conversations:', conversations.length);

  res.status(200).json({
    success: true,
    count: conversations.length,
    data: conversations
  });
});

// @desc    Mark message as read
// @route   PUT /api/messages/:messageId/read
// @access  Private
exports.markAsRead = asyncHandler(async (req, res, next) => {
  const message = await Message.findById(req.params.messageId);

  if (!message) {
    return next(new AppError('Message not found', 404));
  }

  if (message.recipientId.toString() !== req.user._id.toString()) {
    return next(new AppError('Not authorized to mark this message as read', 403));
  }

  message.read = true;
  message.readAt = new Date();
  await message.save();

  res.status(200).json({
    success: true,
    data: message
  });
});

// @desc    Delete a message
// @route   DELETE /api/messages/:messageId
// @access  Private
exports.deleteMessage = asyncHandler(async (req, res, next) => {
  const message = await Message.findById(req.params.messageId);

  if (!message) {
    return next(new AppError('Message not found', 404));
  }

  if (message.senderId.toString() !== req.user._id.toString()) {
    return next(new AppError('Not authorized to delete this message', 403));
  }

  await message.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});
