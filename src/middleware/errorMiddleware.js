const ErrorHandler = require('../utils/customErrorHandler');

// Async handler wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Handle specific Sequelize errors
const handleSequelizeError = (err) => {
  let message = err.message;
  let statusCode = 400;

  // Validation Error
  if (err.name === 'SequelizeValidationError') {
    message = err.errors.map(e => e.message).join(', ');
    statusCode = 400;
  }

  // Unique Constraint Error
  if (err.name === 'SequelizeUniqueConstraintError') {
    const field = err.errors[0].path;
    message = `${field} already exists. Please use another value.`;
    statusCode = 400;
  }

  // Foreign Key Constraint Error
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    message = 'Invalid reference. Related record does not exist.';
    statusCode = 400;
  }

  // Database Connection Error
  if (err.name === 'SequelizeConnectionError') {
    message = 'Database connection failed. Please try again later.';
    statusCode = 503;
  }

  return new ErrorHandler(message, statusCode);
};

// Handle JWT errors
const handleJWTError = () =>
  new ErrorHandler('Invalid token. Please login again.', 401);

const handleJWTExpiredError = () =>
  new ErrorHandler('Your token has expired. Please login again.', 401);

// Handle Validation errors
const handleValidationError = (err) => {
  const errors = Object.values(err.errors).map(e => e.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new ErrorHandler(message, 400);
};

// Mongoose Cast Error
const castError = (err) =>
    new ErrorHandler(`Invalid ${err.path}: ${err.value}`, 400);

// Mongoose Duplicate Key Error
const duplicateEntry = (err) =>
    new ErrorHandler(`${Object.keys(err.keyPattern)[0]} already exists`, 409);

// Send error in development
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    success: false,
    error: err,
    message: err.message,
    stack: err.stack
  });
};

// Send error in production
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
    console.error('ERROR 💥', err);
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

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    error.message = err.message;

    // Handle specific errors
    if (err.name === 'SequelizeValidationError') error = handleSequelizeError(err);
    if (err.name === 'SequelizeUniqueConstraintError') error = handleSequelizeError(err);
    if (err.name === 'SequelizeForeignKeyConstraintError') error = handleSequelizeError(err);
    if (err.name === 'SequelizeConnectionError') error = handleSequelizeError(err);
    if (err.name === 'JsonWebTokenError') error = handleJWTError();
    if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();
    if (err.name === 'ValidationError') error = handleValidationError(err);
    if (err.name === 'CastError') error = castError(err);
    if (err.code === 11000) error = duplicateEntry(err);

    sendErrorProd(error, res);
  }
};

// 404 Not Found handler
const notFound = (req, res, next) => {
  const error = new ErrorHandler(`Route ${req.originalUrl} not found`, 404);
  next(error);
};

module.exports = {
  asyncHandler,
  errorHandler,
  notFound
};

