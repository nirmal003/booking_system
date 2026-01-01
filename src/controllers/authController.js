/**
 * Authentication Controller
 * Handles user registration, login, and profile retrieval
 */

const { User } = require('../models');
const Logger = require('../utils/logger');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  deleteRefreshToken
} = require('../utils/jwt');
const { asyncHandler } = require('../middleware/errorMiddleware');
const ErrorHandler = require('../utils/customErrorHandler');

// Cookie configurations - VAPT COMPLIANT
const ACCESS_TOKEN_COOKIE_OPTIONS = {
  httpOnly: true,      // ✅ XSS Protection - Cannot be accessed by JavaScript
  secure: process.env.NODE_ENV === 'production',  // ✅ HTTPS only in production
  sameSite: 'strict',  // ✅ CSRF Protection
  maxAge: 15 * 60 * 1000,  // 15 minutes
  path: '/'
};

const REFRESH_TOKEN_COOKIE_OPTIONS = {
  httpOnly: true,      // ✅ XSS Protection
  secure: process.env.NODE_ENV === 'production',  // ✅ HTTPS only
  sameSite: 'strict',  // ✅ CSRF Protection
  maxAge: 7 * 24 * 60 * 60 * 1000,  // 7 days
  path: '/'
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = asyncHandler(async (req, res, next) => {
  const { name, email, password, role } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    return next(new ErrorHandler('User with this email already exists', 409));
  }

  // Create user
  const user = await User.create({
    name,
    email,
    password,
    role: role || 'user'
  });

  // Generate tokens
  const accessToken = generateAccessToken({
    id: user.id,
    role: user.role
  });

  const refreshToken = generateRefreshToken({
    id: user.id,
    role: user.role
  });

  // ✅ BOTH tokens in httpOnly cookies (VAPT COMPLIANT)
  res.cookie('accessToken', accessToken, ACCESS_TOKEN_COOKIE_OPTIONS);
  res.cookie('refreshToken', refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);

  // Log the registration
  await Logger.info('User registered', {
    userId: user.id,
    email: user.email,
    role: user.role
  }, req);

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      // token
    }
  });
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Check if email and password provided
  if (!email || !password) {
    return next(new ErrorHandler('Please provide email and password', 400));
  }

  // Find user
  const user = await User.findByEmail(email);
  if (!user) {
    await Logger.warning('Failed login attempt', {
      email,
      reason: 'User not found'
    }, req);

    res.status(401);
    return next(new ErrorHandler('Invalid email or password', 401));
  }

  // Check password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    await Logger.warning('Failed login attempt', {
      userId: user.id,
      email,
      reason: 'Invalid password'
    }, req);

    return next(new ErrorHandler('Invalid email or password', 401));
  }

  // Generate tokens
  const accessToken = generateAccessToken({
    id: user.id,
    role: user.role
  });

  const refreshToken = generateRefreshToken({
    id: user.id,
    role: user.role
  });

  // ✅ BOTH tokens in httpOnly cookies (VAPT COMPLIANT)
  res.cookie('accessToken', accessToken, ACCESS_TOKEN_COOKIE_OPTIONS);
  res.cookie('refreshToken', refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);

  // Log successful login
  await Logger.info('User logged in', {
    userId: user.id,
    email: user.email
  }, req);

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      // token
    }
  });
});

// @desc    Get current user profile
// @route   GET /api/auth/profile
// @access  Private
const getProfile = asyncHandler(async (req, res, next) => {
  const user = await User.findByPk(req.user.id, {
    attributes: { exclude: ['password'] }
  });

  if (!user) {
    return next(new ErrorHandler('User not found', 404));
  }

  res.status(200).json({
    success: true,
    data: { user }
  });
});

// @desc    Refresh access token
// @route   POST /api/auth/refresh-token
// @access  Public
const refreshAccessToken = asyncHandler(async (req, res) => {
  // Get refresh token from httpOnly cookie (NOT from body)
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return next(new ErrorHandler('Refresh token not found. Please login again.', 401));
  }

  // Verify refresh token
  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch (error) {
    return next(new ErrorHandler('Invalid or expired refresh token. Please login again.', 401));
  }

  // Get user
  const user = await User.findByPk(decoded.id);
  if (!user) {
    return next(new ErrorHandler('User not found. Please login again.', 401));
  }

  // Generate new access token
  const accessToken = generateAccessToken({
    id: user.id,
    role: user.role
  });

  // Set new access token in httpOnly cookie
  res.cookie('accessToken', accessToken, ACCESS_TOKEN_COOKIE_OPTIONS);

  res.status(200).json({
    success: true,
    message: 'Token refreshed successfully'
  });
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = asyncHandler(async (req, res) => {
  // Delete refresh token from Redis
  await deleteRefreshToken(res);

  res.status(200).json({
    success: true,
    message: 'Logout successful'
  });
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  const { name, email } = req.body;

  const user = await User.findByPk(req.user.id);

  if (!user) {
    return next(new ErrorHandler('User not found', 404));

  }

  // Check if email is being changed and if it's already taken
  if (email && email !== user.email) {
    const emailExists = await User.findByEmail(email);
    if (emailExists) {
       return next(new ErrorHandler('Email already in use', 400));
    }
  }

  // Update user
  user.name = name || user.name;
  user.email = email || user.email;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    }
  });
});

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findByPk(req.user.id);

  if (!user) {
      return next(new ErrorHandler('User not found', 404));
  }

  // Verify current password
  const isPasswordValid = await user.comparePassword(currentPassword);
  if (!isPasswordValid) {
    return next(new ErrorHandler('Current password is incorrect', 401));
  }

  // Update password
  user.password = newPassword;
  await user.save();

  // Delete all refresh tokens (logout from all devices)
  await deleteRefreshToken(res);

  res.status(200).json({
    success: true,
    message: 'Password changed successfully. Please login again.'
  });
});

module.exports = {
  register,
  login,
  refreshAccessToken,
  logout,
  getProfile,
  updateProfile,
  changePassword
};
