const express = require('express');
const router = express.Router();
const {
  getAuditLogs,
  getMyAuditLogs,
  getResourceAuditLogs,
  getAuditStats,
  deleteOldLogs
} = require('../controllers/auditLog.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');

router.use(protect);

router.get('/my-logs', getMyAuditLogs);
router.get('/', restrictTo('admin'), getAuditLogs);
router.get('/stats', restrictTo('admin'), getAuditStats);
router.get('/resource/:resourceType/:resourceId', restrictTo('instructor', 'admin'), getResourceAuditLogs);
router.delete('/cleanup', restrictTo('admin'), deleteOldLogs);

module.exports = router;


