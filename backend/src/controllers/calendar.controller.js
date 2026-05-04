const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const CalendarEvent = require('../models/Calendar.model');
const Assignment = require('../models/Assignment.model');
const Quiz = require('../models/Quiz.model');
const LiveClass = require('../models/LiveClass.model');

// @desc    Get user's calendar events
// @route   GET /api/calendar/events
// @access  Private
exports.getMyEvents = asyncHandler(async (req, res, next) => {
  const { startDate, endDate, eventType } = req.query;

  let query = { userId: req.user.id };

  // Filter by date range
  if (startDate && endDate) {
    query.startDate = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  // Filter by event type
  if (eventType) {
    query.eventType = eventType;
  }

  const events = await CalendarEvent.find(query)
    .populate('courseId', 'title')
    .populate('assignmentId', 'title')
    .populate('quizId', 'title')
    .populate('liveClassId', 'title')
    .sort({ startDate: 1 });

  res.status(200).json({
    success: true,
    data: events
  });
});

// @desc    Create calendar event
// @route   POST /api/calendar/events
// @access  Private
exports.createEvent = asyncHandler(async (req, res, next) => {
  const eventData = {
    ...req.body,
    userId: req.user.id
  };

  const event = await CalendarEvent.create(eventData);

  res.status(201).json({
    success: true,
    message: 'Event created successfully',
    data: event
  });
});

// @desc    Update calendar event
// @route   PUT /api/calendar/events/:id
// @access  Private
exports.updateEvent = asyncHandler(async (req, res, next) => {
  let event = await CalendarEvent.findById(req.params.id);

  if (!event) {
    return next(new AppError('Event not found', 404));
  }

  // Check ownership
  if (event.userId.toString() !== req.user.id) {
    return next(new AppError('Not authorized to update this event', 403));
  }

  event = await CalendarEvent.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    message: 'Event updated successfully',
    data: event
  });
});

// @desc    Delete calendar event
// @route   DELETE /api/calendar/events/:id
// @access  Private
exports.deleteEvent = asyncHandler(async (req, res, next) => {
  const event = await CalendarEvent.findById(req.params.id);

  if (!event) {
    return next(new AppError('Event not found', 404));
  }

  // Check ownership
  if (event.userId.toString() !== req.user.id) {
    return next(new AppError('Not authorized to delete this event', 403));
  }

  // Don't allow deleting system-generated events
  if (event.isSystemGenerated) {
    return next(new AppError('Cannot delete system-generated events', 400));
  }

  await CalendarEvent.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: 'Event deleted successfully'
  });
});

// @desc    Get upcoming events
// @route   GET /api/calendar/upcoming
// @access  Private
exports.getUpcomingEvents = asyncHandler(async (req, res, next) => {
  const { days = 7 } = req.query;

  const now = new Date();
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + parseInt(days));

  const events = await CalendarEvent.find({
    userId: req.user.id,
    startDate: {
      $gte: now,
      $lte: futureDate
    },
    status: { $ne: 'cancelled' }
  })
    .populate('courseId', 'title')
    .populate('assignmentId', 'title')
    .populate('quizId', 'title')
    .sort({ startDate: 1 })
    .limit(10);

  res.status(200).json({
    success: true,
    data: events
  });
});

// @desc    Sync course deadlines to calendar
// @route   POST /api/calendar/sync-deadlines
// @access  Private
exports.syncDeadlines = asyncHandler(async (req, res, next) => {
  const { courseId } = req.body;

  // Get all assignments for the course
  const assignments = await Assignment.find({ courseId, dueDate: { $exists: true } });

  // Get all quizzes for the course
  const quizzes = await Quiz.find({ courseId, dueDate: { $exists: true } });

  // Get all live classes for the course
  const liveClasses = await LiveClass.find({ courseId, scheduledAt: { $exists: true } });

  let createdCount = 0;

  // Create calendar events for assignments
  for (const assignment of assignments) {
    const existingEvent = await CalendarEvent.findOne({
      userId: req.user.id,
      assignmentId: assignment._id
    });

    if (!existingEvent) {
      await CalendarEvent.create({
        userId: req.user.id,
        title: `Assignment: ${assignment.title}`,
        description: assignment.description,
        eventType: 'assignment',
        startDate: assignment.dueDate,
        allDay: true,
        courseId: courseId,
        assignmentId: assignment._id,
        isSystemGenerated: true,
        color: '#FF9800',
        reminders: [
          { minutesBefore: 1440 }, // 1 day before
          { minutesBefore: 60 }    // 1 hour before
        ]
      });
      createdCount++;
    }
  }

  // Create calendar events for quizzes
  for (const quiz of quizzes) {
    const existingEvent = await CalendarEvent.findOne({
      userId: req.user.id,
      quizId: quiz._id
    });

    if (!existingEvent) {
      await CalendarEvent.create({
        userId: req.user.id,
        title: `Quiz: ${quiz.title}`,
        description: quiz.description,
        eventType: 'quiz',
        startDate: quiz.dueDate,
        allDay: true,
        courseId: courseId,
        quizId: quiz._id,
        isSystemGenerated: true,
        color: '#43C678',
        reminders: [
          { minutesBefore: 1440 },
          { minutesBefore: 60 }
        ]
      });
      createdCount++;
    }
  }

  // Create calendar events for live classes
  for (const liveClass of liveClasses) {
    const existingEvent = await CalendarEvent.findOne({
      userId: req.user.id,
      liveClassId: liveClass._id
    });

    if (!existingEvent) {
      await CalendarEvent.create({
        userId: req.user.id,
        title: `Live Class: ${liveClass.title}`,
        description: liveClass.description,
        eventType: 'live_class',
        startDate: liveClass.scheduledAt,
        endDate: liveClass.endTime,
        courseId: courseId,
        liveClassId: liveClass._id,
        isSystemGenerated: true,
        color: '#6C63FF',
        url: liveClass.meetingLink,
        reminders: [
          { minutesBefore: 30 },
          { minutesBefore: 10 }
        ]
      });
      createdCount++;
    }
  }

  res.status(200).json({
    success: true,
    message: `Synced ${createdCount} events to calendar`,
    data: {
      createdCount
    }
  });
});

// @desc    Get events for a specific date
// @route   GET /api/calendar/date/:date
// @access  Private
exports.getEventsByDate = asyncHandler(async (req, res, next) => {
  const date = new Date(req.params.date);
  const nextDay = new Date(date);
  nextDay.setDate(nextDay.getDate() + 1);

  const events = await CalendarEvent.find({
    userId: req.user.id,
    startDate: {
      $gte: date,
      $lt: nextDay
    }
  })
    .populate('courseId', 'title')
    .sort({ startDate: 1 });

  res.status(200).json({
    success: true,
    data: events
  });
});
