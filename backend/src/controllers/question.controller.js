const Question = require('../models/Question.model');
const Quiz = require('../models/Quiz.model');
const Course = require('../models/Course.model');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

// @desc    Get all questions for a quiz
// @route   GET /api/questions?quizId=xxx
// @access  Private
exports.getQuestionsByQuiz = asyncHandler(async (req, res, next) => {
  const { quizId } = req.query;

  if (!quizId) {
    return next(new AppError('Quiz ID is required', 400));
  }

  const quiz = await Quiz.findById(quizId);
  if (!quiz) {
    return next(new AppError('Quiz not found', 404));
  }

  const questions = await Question.find({ quizId }).sort({ createdAt: 1 });

  res.status(200).json({
    success: true,
    data: questions
  });
});

// @desc    Get single question
// @route   GET /api/questions/:id
// @access  Private
exports.getQuestionById = asyncHandler(async (req, res, next) => {
  const question = await Question.findById(req.params.id);

  if (!question) {
    return next(new AppError('Question not found', 404));
  }

  res.status(200).json({
    success: true,
    data: question
  });
});

// @desc    Create new question
// @route   POST /api/questions
// @access  Private (Instructor/Admin)
exports.createQuestion = asyncHandler(async (req, res, next) => {
  const { quizId, questionText, options, correctAnswer, marks, explanation } = req.body;

  // Verify quiz exists
  const quiz = await Quiz.findById(quizId).populate('courseId');
  if (!quiz) {
    return next(new AppError('Quiz not found', 404));
  }

  // Check if user is the course instructor or admin
  const userId = req.user._id || req.user.id;
  const courseInstructorId = quiz.courseId.instructorId.toString();
  
  if (courseInstructorId !== userId.toString() && req.user.role !== 'admin') {
    return next(new AppError('Not authorized to add questions to this quiz', 403));
  }

  // Validate options array
  if (!Array.isArray(options) || options.length < 2) {
    return next(new AppError('At least 2 options are required', 400));
  }

  // Validate correctAnswer index
  if (correctAnswer < 0 || correctAnswer >= options.length) {
    return next(new AppError('Invalid correct answer index', 400));
  }

  const question = await Question.create({
    quizId,
    questionText,
    options,
    correctAnswer,
    marks: marks || 10,
    explanation
  });

  res.status(201).json({
    success: true,
    data: question
  });
});

// @desc    Update question
// @route   PUT /api/questions/:id
// @access  Private (Instructor/Admin)
exports.updateQuestion = asyncHandler(async (req, res, next) => {
  let question = await Question.findById(req.params.id);

  if (!question) {
    return next(new AppError('Question not found', 404));
  }

  // Verify quiz ownership through course
  const quiz = await Quiz.findById(question.quizId).populate('courseId');
  if (!quiz) {
    return next(new AppError('Quiz not found', 404));
  }

  const userId = req.user._id || req.user.id;
  const courseInstructorId = quiz.courseId.instructorId.toString();
  
  if (courseInstructorId !== userId.toString() && req.user.role !== 'admin') {
    return next(new AppError('Not authorized to update this question', 403));
  }

  // Validate options and correctAnswer if provided
  if (req.body.options) {
    if (!Array.isArray(req.body.options) || req.body.options.length < 2) {
      return next(new AppError('At least 2 options are required', 400));
    }
    const correctIdx = req.body.correctAnswer !== undefined ? req.body.correctAnswer : question.correctAnswer;
    if (correctIdx < 0 || correctIdx >= req.body.options.length) {
      return next(new AppError('Invalid correct answer index', 400));
    }
  }

  question = await Question.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    data: question
  });
});

// @desc    Delete question
// @route   DELETE /api/questions/:id
// @access  Private (Instructor/Admin)
exports.deleteQuestion = asyncHandler(async (req, res, next) => {
  const question = await Question.findById(req.params.id);

  if (!question) {
    return next(new AppError('Question not found', 404));
  }

  // Verify quiz ownership through course
  const quiz = await Quiz.findById(question.quizId).populate('courseId');
  if (!quiz) {
    return next(new AppError('Quiz not found', 404));
  }

  const userId = req.user._id || req.user.id;
  const courseInstructorId = quiz.courseId.instructorId.toString();
  
  if (courseInstructorId !== userId.toString() && req.user.role !== 'admin') {
    return next(new AppError('Not authorized to delete this question', 403));
  }

  await question.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});
