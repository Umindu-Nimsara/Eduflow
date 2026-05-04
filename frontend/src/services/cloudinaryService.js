import axios from 'axios';
import api from './api';

/**
 * Cloudinary Direct Upload Service
 * Uses unsigned upload preset for secure frontend uploads
 */

// Get Cloudinary configuration from backend
export const getCloudinaryConfig = async () => {
  try {
    const response = await api.get('/files/cloudinary-config');
    return response.data.data;
  } catch (error) {
    console.error('Failed to get Cloudinary config:', error);
    // Fallback to environment variables
    return {
      cloudName: 'dm2tqyley',
      uploadPreset: 'EDUFLOW',
      apiUrl: 'https://api.cloudinary.com/v1_1/dm2tqyley/auto/upload',
    };
  }
};

/**
 * Get the correct Cloudinary upload URL based on resource type
 * @param {string} cloudName 
 * @param {string} resourceType - 'image', 'video', 'raw', or 'auto'
 * @returns {string} Upload URL
 */
const getUploadUrl = (cloudName, resourceType = 'auto') => {
  // Use specific resource type endpoint for better reliability
  const type = resourceType || 'auto';
  return `https://api.cloudinary.com/v1_1/${cloudName}/${type}/upload`;
};

/**
 * Upload file directly to Cloudinary
 * @param {File|Object} file - File object or React Native asset
 * @param {Object} options - Upload options
 * @param {Function} onProgress - Progress callback (0-100)
 * @returns {Promise<Object>} Upload result
 */
export const uploadToCloudinary = async (file, options = {}, onProgress) => {
  try {
    console.log('Starting Cloudinary upload...', { fileName: file.name || file.fileName, options });
    
    const config = await getCloudinaryConfig();
    console.log('Cloudinary config:', config);
    
    // Determine resource type from file
    const fileType = file.type || file.mimeType || '';
    let resourceType = 'auto';
    if (fileType.startsWith('video/')) {
      resourceType = 'video';
    } else if (fileType.startsWith('image/')) {
      resourceType = 'image';
    } else if (fileType === 'application/pdf' || fileType.includes('document')) {
      resourceType = 'raw';
    }
    
    // Use the specific resource type URL for reliability
    const uploadUrl = getUploadUrl(config.cloudName, resourceType);
    console.log('Upload URL:', uploadUrl, '| Resource type:', resourceType);
    
    const formData = new FormData();
    
    // Handle React Native file format
    if (file.uri) {
      console.log('Uploading React Native file:', file.uri);
      
      // For React Native, we need to create the file object properly
      const fileObject = {
        uri: file.uri,
        type: file.type || file.mimeType || (resourceType === 'video' ? 'video/mp4' : 'image/jpeg'),
        name: file.name || file.fileName || `upload_${Date.now()}.${resourceType === 'video' ? 'mp4' : 'jpg'}`,
      };
      
      console.log('File object for upload:', fileObject);
      formData.append('file', fileObject);
    } else {
      // Handle web File object
      console.log('Uploading web file object');
      formData.append('file', file);
    }
    
    // Add upload preset (required for unsigned upload)
    formData.append('upload_preset', config.uploadPreset);
    console.log('Using upload preset:', config.uploadPreset);
    
    // Optional parameters
    if (options.folder) {
      formData.append('folder', options.folder);
      console.log('Upload folder:', options.folder);
    }
    
    if (options.tags && Array.isArray(options.tags)) {
      formData.append('tags', options.tags.join(','));
      console.log('Upload tags:', options.tags);
    }
    
    if (options.publicId) {
      formData.append('public_id', options.publicId);
    }

    // Set appropriate timeout based on resource type
    // Videos need much longer timeouts
    const timeout = resourceType === 'video' ? 600000 : 120000; // 10min for video, 2min for others
    console.log(`Uploading to: ${uploadUrl} (timeout: ${timeout / 1000}s)`);

    // Upload to Cloudinary
    const response = await axios.post(uploadUrl, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: timeout,
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          console.log('Upload progress:', percentCompleted + '%');
          onProgress(percentCompleted);
        }
      },
    });

    console.log('Cloudinary response:', response.data);
    const result = response.data;

    // Determine file type
    const detectedFileType = getFileType(result.resource_type, result.format);

    // Save metadata to backend (optional, continue if fails)
    try {
      console.log('Saving metadata to backend...');
      await api.post('/files/save-metadata', {
        url: result.secure_url,
        publicId: result.public_id,
        type: detectedFileType,
        resourceType: result.resource_type,
        format: result.format,
        size: result.bytes,
        width: result.width,
        height: result.height,
        duration: result.duration,
        originalFilename: file.name || file.fileName || 'upload',
        folder: options.folder,
        tags: options.tags,
      });
      console.log('Metadata saved successfully');
    } catch (metadataError) {
      console.error('Failed to save metadata (continuing anyway):', metadataError);
      // Continue even if metadata save fails
    }

    const uploadResult = {
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      type: detectedFileType,
      resourceType: result.resource_type,
      format: result.format,
      width: result.width,
      height: result.height,
      duration: result.duration,
      size: result.bytes,
      thumbnail: result.thumbnail_url,
      result,
    };

    console.log('Upload completed successfully:', uploadResult);
    return uploadResult;

  } catch (error) {
    console.error('Cloudinary upload error:', error);
    
    // Provide more specific error information
    let errorMessage = 'Upload failed';
    
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      errorMessage = 'Network connection failed. Please check your internet connection.';
    } else if (error.code === 'ECONNABORTED') {
      errorMessage = 'Upload timeout. The file may be too large. Please try a smaller file or check your connection.';
    } else if (error.response?.status === 400) {
      errorMessage = error.response.data?.error?.message || 'Invalid upload parameters. Check your upload preset configuration.';
    } else if (error.response?.status === 401) {
      errorMessage = 'Upload authentication failed. Please contact support.';
    } else if (error.response?.status === 413) {
      errorMessage = 'File is too large. Please choose a smaller file.';
    } else if (error.response?.data?.error?.message) {
      errorMessage = error.response.data.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    console.error('Upload error details:', {
      message: errorMessage,
      status: error.response?.status,
      data: error.response?.data,
      code: error.code
    });
    
    throw {
      success: false,
      error: errorMessage,
      originalError: error
    };
  }
};

/**
 * Determine file type from resource type and format
 */
const getFileType = (resourceType, format) => {
  if (resourceType === 'image') return 'image';
  if (resourceType === 'video') return 'video';
  if (format === 'pdf') return 'pdf';
  if (['doc', 'docx', 'txt', 'rtf'].includes(format)) return 'document';
  return 'other';
};

/**
 * Get all uploaded files
 */
export const getUploadedFiles = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    
    if (filters.type) params.append('type', filters.type);
    if (filters.folder) params.append('folder', filters.folder);
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);
    
    const response = await api.get(`/files?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Failed to get files:', error);
    throw error;
  }
};

/**
 * Delete uploaded file
 */
export const deleteUploadedFile = async (fileId) => {
  try {
    const response = await api.delete(`/files/${fileId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to delete file:', error);
    throw error;
  }
};

/**
 * Get file by ID
 */
export const getFileById = async (fileId) => {
  try {
    const response = await api.get(`/files/${fileId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to get file:', error);
    throw error;
  }
};

export default {
  uploadToCloudinary,
  getUploadedFiles,
  deleteUploadedFile,
  getFileById,
  getCloudinaryConfig,
};
