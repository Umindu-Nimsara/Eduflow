const express = require('express');
const router = express.Router();
const {
  createFlashcard,
  getFlashcards,
  updateFlashcard,
  deleteFlashcard,
  recordAnswer
} = require('../controllers/flashcard.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

router.post('/', createFlashcard);
router.get('/course/:courseId', getFlashcards);
router.put('/:id', updateFlashcard);
router.delete('/:id', deleteFlashcard);
router.post('/:id/answer', recordAnswer);

module.exports = router;
