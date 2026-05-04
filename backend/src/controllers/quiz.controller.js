const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const Quiz = require('../models/Quiz.model');
const Question = require('../models/Question.model');
const QuizAttempt = require('../models/QuizAttempt.model');
const Course = require('../models/Course.model');
const Streak = require('../models/Streak.model');
const { createNotification, NOTIFICATION_TYPES } = require('../utils/notificationHelper');

// @desc    Get quizzes by course
// @route   GET /api/quizzes?courseId=xxx
// @access  Public
exports.getQuizzesByCourse = asyncHandler(async (req, res, next) => {
  const courseId = req.params.courseId || req.query.courseId;

  // If no courseId, return all published quizzes (for general quiz list)
  if (!courseId) {
    const quizzes = await Quiz.find({ isPublished: true })
      .populate('courseId', 'title')
      .sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: quizzes });
  }

  // Check if user is instructor/admin - show all quizzes including drafts
  let query = { courseId: courseId };
  
  // If user is not authenticated or not instructor/admin, only show published
  if (!req.user || (req.user.role !== 'instructor' && req.user.role !== 'admin')) {
    query.isPublished = true;
  }

  const quizzes = await Quiz.find(query)
    .populate('courseId', 'title')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: quizzes
  });
});

// @desc    Get single quiz by ID
// @route   GET /api/quizzes/:id
// @access  Public
exports.getQuizById = asyncHandler(async (req, res, next) => {
  const quiz = await Quiz.findById(req.params.id)
    .populate('courseId', 'title instructorId');

  if (!quiz) {
    return next(new AppError('Quiz not found', 404));
  }

  // Fetch questions for this quiz
  const Question = require('../models/Question.model');
  const questions = await Question.find({ quizId: quiz._id }).select('-correctAnswer -explanation');

  // Add questions to quiz object
  const quizWithQuestions = quiz.toObject();
  quizWithQuestions.questions = questions;

  res.status(200).json({
    success: true,
    data: quizWithQuestions
  });
});

// @desc    Create new quiz
// @route   POST /api/quizzes
// @access  Private (Instructor)
exports.createQuiz = asyncHandler(async (req, res, next) => {
  const { courseId, title, description, passingScore, timeLimit, totalMarks } = req.body;

  // Check if course exists
  const course = await Course.findById(courseId);
  if (!course) {
    return next(new AppError('Course not found', 404));
  }

  // Check ownership
  if (course.instructorId.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('You are not authorized to create quizzes for this course', 403));
  }

  const quiz = await Quiz.create({
    courseId,
    title,
    description,
    passingScore,
    timeLimit,
    totalMarks,
    isPublished: false
  });

  res.status(201).json({
    success: true,
    message: 'Quiz created successfully',
    data: quiz
  });
});

// @desc    Update quiz
// @route   PUT /api/quizzes/:id
// @access  Private (Instructor)
exports.updateQuiz = asyncHandler(async (req, res, next) => {
  let quiz = await Quiz.findById(req.params.id).populate('courseId');

  if (!quiz) {
    return next(new AppError('Quiz not found', 404));
  }

  // Check ownership
  if (quiz.courseId.instructorId.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('You are not authorized to update this quiz', 403));
  }

  const { title, description, passingScore, timeLimit, totalMarks, isPublished } = req.body;

  quiz = await Quiz.findByIdAndUpdate(
    req.params.id,
    { title, description, passingScore, timeLimit, totalMarks, isPublished },
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    message: 'Quiz updated successfully',
    data: quiz
  });
});

// @desc    Delete quiz
// @route   DELETE /api/quizzes/:id
// @access  Private (Instructor)
exports.deleteQuiz = asyncHandler(async (req, res, next) => {
  const quiz = await Quiz.findById(req.params.id).populate('courseId');

  if (!quiz) {
    return next(new AppError('Quiz not found', 404));
  }

  // Check ownership
  if (quiz.courseId.instructorId.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('You are not authorized to delete this quiz', 403));
  }

  // Delete all questions associated with this quiz
  await Question.deleteMany({ quizId: req.params.id });

  await Quiz.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: 'Quiz and associated questions deleted successfully'
  });
});

// @desc    Submit quiz attempt
// @route   POST /api/quizzes/:id/submit
// @access  Private (Student)
exports.submitQuiz = asyncHandler(async (req, res, next) => {
  const { answers, timeTaken } = req.body;

  const quiz = await Quiz.findById(req.params.id);
  if (!quiz) {
    return next(new AppError('Quiz not found', 404));
  }

  // Get all questions for this quiz
  const questions = await Question.find({ quizId: req.params.id });

  // Calculate score
  let score = 0;
  const processedAnswers = [];

  for (const answer of answers) {
    const question = questions.find(q => q._id.toString() === answer.questionId);
    if (question) {
      const isCorrect = question.correctAnswer === answer.selectedAnswer;
      if (isCorrect) {
        score += question.marks;
      }
      processedAnswers.push({
        questionId: answer.questionId,
        selectedAnswer: answer.selectedAnswer,
        isCorrect
      });
    }
  }

  const percentage = (score / quiz.totalMarks) * 100;
  const passed = percentage >= quiz.passingScore;

  // Create quiz attempt
  const attempt = await QuizAttempt.create({
    userId: req.user.id,
    quizId: req.params.id,
    score,
    passed,
    percentage: Math.round(percentage * 100) / 100,
    answers: processedAnswers,
    timeTaken
  });

  // Populate attempt with quiz and question details for result screen
  const populatedAttempt = await QuizAttempt.findById(attempt._id)
    .populate('quizId');

  // Add detailed answers with question text and options
  const detailedAnswers = [];
  for (const answer of processedAnswers) {
    const question = questions.find(q => q._id.toString() === answer.questionId);
    if (question) {
      detailedAnswers.push({
        questionId: answer.questionId,
        selectedOption: answer.selectedAnswer,
        isCorrect: answer.isCorrect,
        question: {
          questionText: question.questionText,
          options: question.options,
          correctOption: question.correctAnswer,
          explanation: question.explanation
        }
      });
    }
  }

  // Create notification
  await createNotification(
    req.user.id,
    'Quiz Result',
    `You ${passed ? 'passed' : 'failed'} the quiz "${quiz.title}" with ${percentage.toFixed(1)}%`,
    NOTIFICATION_TYPES.QUIZ_RESULT,
    attempt._id,
    'QuizAttempt'
  );

  // Update streak when quiz is completed (regardless of pass/fail)
  await updateUserStreak(req.user.id);

  res.status(201).json({
    success: true,
    message: 'Quiz submitted successfully',
    data: {
      _id: attempt._id,
      score: Math.round(percentage * 100) / 100,
      passed,
      timeTaken,
      completedAt: attempt.attemptedAt || new Date(),
      quiz: {
        _id: quiz._id,
        title: quiz.title,
        passingScore: quiz.passingScore,
        totalMarks: quiz.totalMarks
      },
      answers: detailedAnswers
    }
  });
});

// @desc    Get quiz attempts by user
// @route   GET /api/quizzes/attempts/:userId
// @access  Private
exports.getQuizAttempts = asyncHandler(async (req, res, next) => {
  // Users can only view their own attempts, unless admin
  if (req.params.userId !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('You are not authorized to view these attempts', 403));
  }

  const attempts = await QuizAttempt.find({ userId: req.params.userId })
    .populate('quizId', 'title courseId')
    .sort({ attemptedAt: -1 });

  res.status(200).json({
    success: true,
    data: attempts
  });
});
// Helper function to update user streak
const updateUserStreak = async (userId) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let streak = await Streak.findOne({ userId });

    if (!streak) {
      // Create new streak
      streak = await Streak.create({
        userId,
        currentStreak: 1,
        longestStreak: 1,
        lastActivityDate: new Date(),
        totalActiveDays: 1
      });
    } else {
      const lastActivity = new Date(streak.lastActivityDate);
      lastActivity.setHours(0, 0, 0, 0);

      const daysDiff = Math.floor((today - lastActivity) / (1000 * 60 * 60 * 24));

      if (daysDiff === 0) {
        // Same day, no change to streak count but update activity time
        streak.lastActivityDate = new Date();
        // If streak is 0, set it to 1 (first activity)
        if (streak.currentStreak === 0) {
          streak.currentStreak = 1;
          streak.longestStreak = 1;
          streak.totalActiveDays = 1;
        }
      } else if (daysDiff === 1) {
        // Consecutive day - increase streak
        streak.currentStreak += 1;
        streak.totalActiveDays += 1;
        if (streak.currentStreak > streak.longestStreak) {
          streak.longestStreak = streak.currentStreak;
        }
        streak.lastActivityDate = new Date();
      } else if (daysDiff > 1) {
        // Streak broken - reset to 1
        streak.currentStreak = 1;
        streak.totalActiveDays += 1;
        streak.lastActivityDate = new Date();
      }

      await streak.save();
    }

    console.log(`Streak updated for user ${userId}: ${streak.currentStreak} days`);
  } catch (error) {
    console.error('Error updating streak:', error);
    // Don't throw error - streak update shouldn't break quiz submission
  }
};