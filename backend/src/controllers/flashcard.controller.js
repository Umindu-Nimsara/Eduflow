const Flashcard = require('../models/Flashcard.model');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

exports.createFlashcard = asyncHandler(async (req, res, next) => {
  const flashcard = await Flashcard.create({
    ...req.body,
    createdBy: req.user._id
  });

  res.status(201).json({
    success: true,
    data: flashcard
  });
});

exports.getFlashcards = asyncHandler(async (req, res, next) => {
  const { courseId } = req.params;
  const { category, difficulty } = req.query;

  const query = { courseId };
  if (category) query.category = category;
  if (difficulty) query.difficulty = difficulty;

  const flashcards = await Flashcard.find(query)
    .populate('createdBy', 'name')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: flashcards.length,
    data: flashcards
  });
});

exports.updateFlashcard = asyncHandler(async (req, res, next) => {
  let flashcard = await Flashcard.findById(req.params.id);

  if (!flashcard) {
    return next(new AppError('Flashcard not found', 404));
  }

  if (flashcard.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'instructor') {
    return next(new AppError('Not authorized', 403));
  }

  flashcard = await Flashcard.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );

  res.status(200).json({
    success: true,
    data: flashcard
  });
});

exports.deleteFlashcard = asyncHandler(async (req, res, next) => {
  const flashcard = await Flashcard.findById(req.params.id);

  if (!flashcard) {
    return next(new AppError('Flashcard not found', 404));
  }

  if (flashcard.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'instructor') {
    return next(new AppError('Not authorized', 403));
  }

  await flashcard.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});

exports.recordAnswer = asyncHandler(async (req, res, next) => {
  const { isCorrect } = req.body;
  
  const flashcard = await Flashcard.findById(req.params.id);

  if (!flashcard) {
    return next(new AppError('Flashcard not found', 404));
  }

  flashcard.stats.views += 1;
  if (isCorrect) {
    flashcard.stats.correct += 1;
  } else {
    flashcard.stats.incorrect += 1;
  }

  await flashcard.save();

  res.status(200).json({
    success: true,
    data: flashcard
  });
});
