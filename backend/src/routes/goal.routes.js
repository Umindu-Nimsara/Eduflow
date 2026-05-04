const express = require('express');
const router = express.Router();
const {
  createGoal,
  getMyGoals,
  getGoal,
  updateGoal,
  updateProgress,
  toggleMilestone,
  deleteGoal,
  getGoalStats
} = require('../controllers/goal.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

router.post('/', createGoal);
router.get('/my-goals', getMyGoals);
router.get('/stats', getGoalStats);
router.get('/:id', getGoal);
router.put('/:id', updateGoal);
router.put('/:id/progress', updateProgress);
router.put('/:id/milestones/:milestoneId/toggle', toggleMilestone);
router.delete('/:id', deleteGoal);

module.exports = router;
