const express = require('express');
const router = express.Router();
const {
  createWellnessCheck,
  getMyWellnessChecks,
  getWellnessStats,
  getStudentWellness,
  provideSupport
} = require('../controllers/wellness.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');

router.use(protect);

router.post('/', createWellnessCheck);
router.get('/my-checks', getMyWellnessChecks);
router.get('/my-stats', getWellnessStats);
router.get('/student/:userId', restrictTo('instructor', 'admin'), getStudentWellness);
router.put('/:id/support', restrictTo('instructor', 'admin'), provideSupport);

module.exports = router;


