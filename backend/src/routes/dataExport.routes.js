const express = require('express');
const router = express.Router();
const {
  exportUserData,
  exportCourseData
} = require('../controllers/dataExport.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');

router.use(protect);

router.get('/my-data', exportUserData);
router.get('/course/:courseId', restrictTo('instructor', 'admin'), exportCourseData);

module.exports = router;


