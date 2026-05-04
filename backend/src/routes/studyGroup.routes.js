const express = require('express');
const router = express.Router();
const {
  createStudyGroup,
  getStudyGroupsByCourse,
  getStudyGroup,
  joinStudyGroup,
  leaveStudyGroup,
  updateStudyGroup,
  deleteStudyGroup,
  getMyStudyGroups
} = require('../controllers/studyGroup.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

router.post('/', createStudyGroup);
router.get('/my-groups', getMyStudyGroups);
router.get('/course/:courseId', getStudyGroupsByCourse);
router.get('/:id', getStudyGroup);
router.post('/:id/join', joinStudyGroup);
router.post('/:id/leave', leaveStudyGroup);
router.put('/:id', updateStudyGroup);
router.delete('/:id', deleteStudyGroup);

module.exports = router;
