const AppError = require('../utils/AppError');

// 404 handler for undefined routes
const notFound = (req, res, next) => {
  const message = `Cannot find ${req.originalUrl} on this server`;
  next(new AppError(message, 404));
};

module.exports = notFound;
