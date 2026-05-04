const AppError = require('../utils/AppError');
const multer = require('multer');

// Handle Mongoose CastError (invalid ObjectId)
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

// Handle Mongoose duplicate key error
const handleDuplicateFieldsDB = (err) => {
  const field = Object.keys(err.keyValue)[0];
  const value = err.keyValue[field];
  const message = `Duplicate field value: ${field} = '${value}'. Please use another value.`;
  return new AppError(message, 400);
};

// Handle Mongoose validation error
const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

// Handle JWT invalid token error
const handleJWTError = () => {
  return new AppError('Invalid token. Please log in again.', 401);
};

// Handle JWT expired token error
const handleJWTExpiredError = () => {
  return new AppError('Your token has expired. Please log in again.', 401);
};

// Handle Multer errors (file upload)
const handleMulterError = (err) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    const maxSizeMB = err.field === 'video' ? 500 : err.field === 'document' ? 10 : 5;
    return new AppError(`File too large. Maximum size is ${maxSizeMB}MB.`, 400);
  }
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return new AppError(`Unexpected file field: "${err.field}". Please check the upload field name.`, 400);
  }
  if (err.code === 'LIMIT_FILE_COUNT') {
    return new AppError('Too many files uploaded at once.', 400);
  }
  return new AppError(err.message || 'File upload error', 400);
};

// Send error response in development
const sendErrorDev = (err, res) => {
  console.error('=== ERROR IN DEVELOPMENT ===');
  console.error('Status Code:', err.statusCode);
  console.error('Message:', err.message);
  console.error('Stack:', err.stack);
  console.error('===========================');
  
  res.status(err.statusCode).json({
    success: false,
    status: err.status,
    message: err.message,
    error: err,
    stack: err.stack
  });
};

// Send error response in production
const sendErrorProd = (err, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message
    });
  } 
  // Programming or unknown error: don't leak error details
  else {
    console.error('ERROR:', err);
    res.status(500).json({
      success: false,
      message: 'Something went wrong. Please try again later.'
    });
  }
};

// Global error handler middleware
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Handle Multer errors first (file upload issues)
  if (err instanceof multer.MulterError) {
    const multerError = handleMulterError(err);
    return res.status(multerError.statusCode).json({
      success: false,
      message: multerError.message
    });
  }

  // Handle file filter errors (e.g., "Only video files are allowed")
  if (err.message && (
    err.message.includes('Only video files are allowed') ||
    err.message.includes('Only image files are allowed') ||
    err.message.includes('Only PDF') 
  )) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    error.message = err.message;

    // Handle specific error types
    if (err.name === 'CastError') error = handleCastErrorDB(err);
    if (err.code === 11000) error = handleDuplicateFieldsDB(err);
    if (err.name === 'ValidationError') error = handleValidationErrorDB(err);
    if (err.name === 'JsonWebTokenError') error = handleJWTError();
    if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();

    sendErrorProd(error, res);
  }
};

module.exports = errorHandler;

