const express = require('express');
const { protect } = require('../middleware/auth.middleware');
const {
  getMyEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  getUpcomingEvents,
  syncDeadlines,
  getEventsByDate
} = require('../controllers/calendar.controller');

const router = express.Router();

// All routes are protected
router.use(protect);

router.get('/events', getMyEvents);
router.post('/events', createEvent);
router.put('/events/:id', updateEvent);
router.delete('/events/:id', deleteEvent);
router.get('/upcoming', getUpcomingEvents);
router.post('/sync-deadlines', syncDeadlines);
router.get('/date/:date', getEventsByDate);

module.exports = router;
