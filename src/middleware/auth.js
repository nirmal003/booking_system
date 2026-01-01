const jwt = require('jsonwebtoken');
const { User } = require('../models');

// @desc    Authenticate user via httpOnly cookie (VAPT COMPLIANT)
// @access  Protected routes
const authenticate = async (req, res, next) => {
  try {
    // ✅ Get access token from httpOnly cookie (NOT Authorization header!)
    const token = req.cookies.accessToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access token not found. Please login.',
        code: 'NO_TOKEN'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    // Optional: Verify user still exists and is active
    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found. Please login again.',
        code: 'USER_NOT_FOUND'
      });
    }

    // Attach user info to request
    req.user = {
      id: decoded.id,
      role: decoded.role
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Access token expired. Please refresh.',
        code: 'TOKEN_EXPIRED'  // Frontend can catch this for auto-refresh
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid access token. Please login again.',
        code: 'INVALID_TOKEN'
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Authentication error. Please try again.',
      code: 'AUTH_ERROR'
    });
  }
};

// @desc    Authorize user by role
// @access  Admin/Moderator routes
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Role: ${req.user.role} is not allowed to access this resource`,
      });
    }

    next();
  };
};

module.exports = { authenticate, authorize };