const express = require('express');
const passport = require('passport');
const router = express.Router();

const {
  register,
  login,
  googleCallback,
  verifyEmail,
  getProfile,
  updateProfile,
  logout
} = require('../controllers/authController');

const { authenticateToken } = require('../middleware/authMiddleware');

// Local Authentication Routes
router.post('/register', register);
router.post('/login', login);

// Google OAuth Routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), googleCallback);

// Email Verification Route
router.get('/verify-email', verifyEmail);

// Protected Routes
router.get('/profile', authenticateToken, getProfile);
router.post('/profile/update', authenticateToken, updateProfile);


router.post('/logout', logout);

module.exports = router;
