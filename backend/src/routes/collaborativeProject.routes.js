const express = require('express');
const router = express.Router();
const {
  createProject,
  getProjects,
  getProject,
  addTeamMember,
  addTask,
  updateTaskStatus,
  gradeProject
} = require('../controllers/collaborativeProject.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');

router.use(protect);

router.post('/', createProject);
router.get('/course/:courseId', getProjects);
router.get('/:id', getProject);
router.post('/:id/members', addTeamMember);
router.post('/:id/tasks', addTask);
router.put('/:id/tasks/:taskId/status', updateTaskStatus);
router.put('/:id/grade', restrictTo('instructor', 'admin'), gradeProject);

module.exports = router;


