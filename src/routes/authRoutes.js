const express = require('express');
const router = express.Router();

const { register, login, getProfile, refreshAccessToken, logout } = require('../controllers/authController');
const { registerSchema, loginSchema } = require('../validators/schemas');
const validate = require('../validators/validate');
const { authenticate } = require('../middleware/auth');
const { authLimiter } = require('../middleware/security');

// Apply rate limiting to auth routes
router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/refresh-token', refreshAccessToken);
router.post('/logout', authenticate, logout);
router.get('/profile', authenticate, getProfile);

module.exports = router;