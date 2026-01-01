const jwt = require('jsonwebtoken');
const ErrorHandler = require('./customErrorHandler');

const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};


// Generate Access Token (Short-lived: 15 minutes)
const generateAccessToken = (payload) => {
  return jwt.sign(
    payload,
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRE || '15m' }
  );
};

// Generate Refresh Token (Long-lived: 7 days)
const generateRefreshToken = (payload) => {
  return jwt.sign(
    payload,
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' }
  );
};

// Verify Access Token
const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
  } catch (error) {
    return next(new ErrorHandler('Invalid or expired access token', 401));
  }
};

// Verify Refresh Token
const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch (error) {
    return next(new ErrorHandler('Invalid or expired refresh token', 401));
  }
};

// Delete Refresh Token from Redis
const deleteRefreshToken = async (res) => {
    // Clear cookies
  res.clearCookie('accessToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/'
  });

  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/'
  });
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  deleteRefreshToken,
};

