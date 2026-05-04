const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../../uploads');
const createUploadDirs = () => {
  const dirs = [
    uploadsDir,
    path.join(uploadsDir, 'courses'),
    path.join(uploadsDir, 'lessons'),
    path.join(uploadsDir, 'profiles'),
    path.join(uploadsDir, 'submissions'),
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

createUploadDirs();

/**
 * Save file to local storage
 * @param {Buffer} buffer - File buffer
 * @param {string} folder - Folder name (courses, lessons, profiles, submissions)
 * @param {string} originalName - Original file name
 * @returns {Promise<{url: string, path: string}>}
 */
const saveToLocal = async (buffer, folder, originalName = 'file') => {
  try {
    // Generate unique filename
    const ext = path.extname(originalName);
    const filename = `${crypto.randomBytes(16).toString('hex')}${ext}`;
    const folderPath = path.join(uploadsDir, folder);
    const filePath = path.join(folderPath, filename);
    
    // Ensure folder exists
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }
    
    // Write file
    await fs.promises.writeFile(filePath, buffer);
    
    // Return URL and path
    const url = `/uploads/${folder}/${filename}`;
    
    return {
      url,
      path: filePath,
      secure_url: url,
      public_id: `${folder}/${filename}`,
    };
  } catch (error) {
    console.error('Local storage error:', error);
    throw new Error('Failed to save file locally');
  }
};

/**
 * Delete file from local storage
 * @param {string} publicId - Public ID (folder/filename)
 */
const deleteFromLocal = async (publicId) => {
  try {
    const filePath = path.join(uploadsDir, publicId);
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
  } catch (error) {
    console.error('Delete file error:', error);
  }
};

module.exports = {
  saveToLocal,
  deleteFromLocal,
  uploadsDir,
};
