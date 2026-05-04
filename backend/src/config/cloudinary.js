const cloudinary = require('cloudinary').v2;
const multer = require('multer');

// Configure Cloudinary - only if real credentials provided
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = String(process.env.CLOUDINARY_API_KEY); // Convert to string
const apiSecret = process.env.CLOUDINARY_API_SECRET;

console.log('Cloudinary Config:', {
  cloudName,
  apiKey,
  apiKeyType: typeof apiKey,
  apiSecret: apiSecret ? '***' : 'missing'
});

if (cloudName && apiKey && apiSecret && 
    cloudName !== 'your_cloud_name' && 
    apiKey !== 'your_api_key') {
  cloudinary.config({ 
    cloud_name: cloudName, 
    api_key: apiKey, 
    api_secret: apiSecret 
  });
  console.log('✅ Cloudinary configured successfully');
} else {
  console.log('⚠️  Cloudinary not configured - file uploads will use placeholder URLs');
}

// Multer memory storage
const storage = multer.memoryStorage();

// File filter for images
const imageFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

// File filter for videos
const videoFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Only video files are allowed'), false);
  }
};

// File filter for documents
const documentFilter = (req, file, cb) => {
  const allowedTypes = ['application/pdf', 'application/msword', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF, DOC, DOCX, PPT, PPTX files are allowed'), false);
  }
};

// Multer upload configurations
const uploadImage = multer({
  storage: storage,
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

const uploadVideo = multer({
  storage: storage,
  fileFilter: videoFilter,
  limits: { fileSize: 500 * 1024 * 1024 } // 500MB limit (increased for video)
});

const uploadDocument = multer({
  storage: storage,
  fileFilter: documentFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Upload to Cloudinary helper function with local storage fallback
const uploadToCloudinary = async (buffer, folder, resourceType = 'image', originalName = 'file') => {
  // Check if Cloudinary is properly configured
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const useLocalStorage = process.env.USE_LOCAL_STORAGE === 'true';
  
  // Use local storage if enabled or Cloudinary not configured
  if (useLocalStorage || !cloudName || !apiKey || cloudName === 'your_cloud_name' || apiKey === 'your_api_key') {
    console.log('📁 Using local storage for file upload');
    const { saveToLocal } = require('../utils/localStorage');
    return await saveToLocal(buffer, folder, originalName);
  }

  // Build upload options based on resource type
  const uploadOptions = {
    folder: folder,
    resource_type: resourceType,
    timeout: 600000, // 10 minutes timeout for Cloudinary API call
  };

  // Video-specific options for reliable uploads
  if (resourceType === 'video') {
    uploadOptions.chunk_size = 6 * 1024 * 1024; // 6MB chunks for large video uploads
    uploadOptions.eager_async = true; // Process transformations asynchronously
    uploadOptions.resource_type = 'video';
  }

  // For very large files (>20MB), use chunked upload approach
  const fileSizeMB = buffer.length / (1024 * 1024);
  console.log(`📦 File size: ${fileSizeMB.toFixed(2)} MB, Resource type: ${resourceType}`);

  // Try Cloudinary upload
  return new Promise((resolve, reject) => {
    // Set a generous timeout for the upload operation
    const timeoutMs = resourceType === 'video' ? 600000 : 120000; // 10min for video, 2min for others
    const timer = setTimeout(() => {
      reject(new Error(`Upload timed out after ${timeoutMs / 1000} seconds`));
    }, timeoutMs);

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      async (error, result) => {
        clearTimeout(timer);
        if (error) {
          console.error('Cloudinary upload failed:', error.message);
          console.error('Error details:', JSON.stringify(error, null, 2));
          
          // Fallback to local storage on error
          try {
            console.log('📁 Falling back to local storage...');
            const { saveToLocal } = require('../utils/localStorage');
            const localResult = await saveToLocal(buffer, folder, originalName);
            resolve(localResult);
          } catch (localError) {
            reject(localError);
          }
        } else {
          console.log('✅ Cloudinary upload successful:', {
            url: result.secure_url,
            publicId: result.public_id,
            format: result.format,
            resourceType: result.resource_type,
            duration: result.duration,
            size: result.bytes,
          });
          resolve(result);
        }
      }
    );

    // Handle stream errors
    uploadStream.on('error', (streamError) => {
      clearTimeout(timer);
      console.error('Upload stream error:', streamError);
      reject(streamError);
    });

    // Write buffer to stream in chunks to avoid memory issues
    const CHUNK_SIZE = 4 * 1024 * 1024; // 4MB chunks
    let offset = 0;

    const writeChunk = () => {
      while (offset < buffer.length) {
        const end = Math.min(offset + CHUNK_SIZE, buffer.length);
        const chunk = buffer.slice(offset, end);
        const canContinue = uploadStream.write(chunk);
        offset = end;

        if (!canContinue) {
          // Back-pressure: wait for drain event before writing more
          uploadStream.once('drain', writeChunk);
          return;
        }
      }
      // All chunks written, end the stream
      uploadStream.end();
    };

    writeChunk();
  });
};

module.exports = {
  cloudinary,
  uploadImage,
  uploadVideo,
  uploadDocument,
  uploadToCloudinary
};
