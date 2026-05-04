const Notification = require('../models/Notification.model');

// Create notification helper
const createNotification = async (userId, title, message, type, relatedId = null, relatedModel = null) => {
  try {
    await Notification.create({
      userId,
      title,
      message,
      type,
      relatedId,
      relatedModel,
      isRead: false
    });
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

// Notification types
const NOTIFICATION_TYPES = {
  COURSE_UPDATE: 'course_update',
  QUIZ_RESULT: 'quiz_result',
  ASSIGNMENT_GRADED: 'assignment_graded',
  DISCUSSION_REPLY: 'discussion_reply',
  ENROLLMENT_CONFIRMED: 'enrollment_confirmed',
  CERTIFICATE_ISSUED: 'certificate_issued',
  ANNOUNCEMENT: 'announcement'
};

module.exports = {
  createNotification,
  NOTIFICATION_TYPES
};
