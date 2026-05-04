const express = require('express');
const { protect, restrictTo } = require('../middleware/auth.middleware');
const { getAdminLogs } = require('../controllers/admin.controller');

const router = express.Router();

// Routes
router.get('/logs', protect, restrictTo('admin'), getAdminLogs);

module.exports = router;
