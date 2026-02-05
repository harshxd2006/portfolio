import express from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { isAuthenticated, generateToken } from '../middleware/auth.js';

const router = express.Router();

// Google OAuth routes
router.get('/google',
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    prompt: 'select_account'
  })
);

router.get('/google/callback',
  passport.authenticate('google', { 
    failureRedirect: '/login',
    session: false 
  }),
  (req, res) => {
    const token = generateToken(req.user._id);
    
    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    
    // Redirect to frontend with token
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
  }
);

// GitHub OAuth routes
router.get('/github',
  passport.authenticate('github', { 
    scope: ['user:email'],
    prompt: 'select_account'
  })
);

router.get('/github/callback',
  passport.authenticate('github', { 
    failureRedirect: '/login',
    session: false 
  }),
  (req, res) => {
    const token = generateToken(req.user._id);
    
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
    
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
  }
);

// Get current user
router.get('/me', isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-__v')
      .populate('followers', 'username displayName avatar')
      .populate('following', 'username displayName avatar');
    
    res.json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user data',
      error: error.message
    });
  }
});

// Update user profile
router.put('/profile', isAuthenticated, async (req, res) => {
  try {
    const { displayName, bio, location, website, title, skills } = req.body;
    
    const updateData = {};
    if (displayName) updateData.displayName = displayName;
    if (bio !== undefined) updateData.bio = bio;
    if (location !== undefined) updateData.location = location;
    if (website !== undefined) updateData.website = website;
    if (title !== undefined) updateData.title = title;
    if (skills) updateData.skills = skills;
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).select('-__v');
    
    res.json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message
    });
  }
});

// Logout
router.post('/logout', isAuthenticated, (req, res) => {
  res.clearCookie('token');
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

// Refresh token
router.post('/refresh', isAuthenticated, (req, res) => {
  const token = generateToken(req.user._id);
  
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
  
  res.json({
    success: true,
    token
  });
});

// Check username availability
router.get('/check-username/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const existingUser = await User.findOne({ username: username.toLowerCase() });
    
    res.json({
      success: true,
      available: !existingUser
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error checking username',
      error: error.message
    });
  }
});

export default router;
