const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');

// Rate limiting to prevent brute force attacks
const createRateLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      message: message || 'Too many requests, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Skip successful requests in rate limit count for certain routes
    skipSuccessfulRequests: false,
    // Skip failed requests for certain routes
    skipFailedRequests: false
  });
};

// General rate limiter for all routes
const generalLimiter = createRateLimiter(
  parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  'Too many requests from this IP, please try again later.'
);

// Strict rate limiter for authentication routes
const authLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  5, // 5 attempts
  'Too many login attempts, please try again after 15 minutes.'
);

// Booking rate limiter to prevent ticket hoarding
const bookingLimiter = createRateLimiter(
  60 * 1000, // 1 minute
  3, // 3 bookings per minute
  'Too many booking attempts, please slow down.'
);

// Sanitize data to prevent NoSQL injection
const sanitizeData = () => {
  return mongoSanitize({
    replaceWith: '_',
    onSanitize: ({ req, key }) => {
      console.warn(`⚠️  Request sanitized: ${key} in ${req.originalUrl}`);
    }
  });
};

// Prevent HTTP Parameter Pollution
const preventHPP = () => {
  return hpp({
    whitelist: ['page', 'limit', 'sort'] // Allow these params to be arrays
  });
};

// Custom input sanitization middleware
const sanitizeInput = (req, res, next) => {
  // Remove any potential XSS from string inputs
  const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;

    // Remove < > to prevent basic XSS
    return str.replace(/[<>]/g, '');
  };

  const sanitizeObject = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;

    const sanitized = Array.isArray(obj) ? [] : {};

    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        if (typeof obj[key] === 'string') {
          sanitized[key] = sanitizeString(obj[key]);
        } else if (typeof obj[key] === 'object') {
          sanitized[key] = sanitizeObject(obj[key]);
        } else {
          sanitized[key] = obj[key];
        }
      }
    }

    return sanitized;
  };

  // Sanitize body, query, and params
  req.body = sanitizeObject(req.body);
  req.query = sanitizeObject(req.query);
  req.params = sanitizeObject(req.params);

  next();
};

module.exports = {
  generalLimiter,
  authLimiter,
  bookingLimiter,
  sanitizeData,
  preventHPP,
  sanitizeInput
};
