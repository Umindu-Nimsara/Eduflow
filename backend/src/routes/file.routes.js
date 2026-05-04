const express = require('express');
const { protect } = require('../middleware/auth.middleware');
const { uploadDocument } = require('../config/cloudinary');
const {
  saveFileMetadata,
  getAllFiles,
  getFileById,
  deleteFile,
  uploadFile,
  getCloudinaryConfig,
} = require('../controllers/file.controller');

const router = express.Router();

// Public route - get Cloudinary config
router.get('/cloudinary-config', getCloudinaryConfig);

// Protected routes
router.use(protect); // All routes below require authentication

router.post('/save-metadata', saveFileMetadata);
router.get('/', getAllFiles);
router.get('/:id', getFileById);
router.delete('/:id', deleteFile);
router.post('/upload', uploadDocument.single('file'), uploadFile);

module.exports = router;
