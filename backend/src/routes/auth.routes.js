import express from 'express';
import passport from 'passport';
import User from '../models/User.js';
import { isAuthenticated, generateToken } from '../middleware/auth.js';

const router = express.Router();

// ================= GOOGLE =================
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

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.redirect(`${process.env.FRONTEND_URL}/auth/callback`);
  }
);

// ================= GITHUB =================
router.get('/github',
  passport.authenticate('github', {
    scope: ['user:email']
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
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.redirect(`${process.env.FRONTEND_URL}/auth/callback`);
  }
);

// ================= CURRENT USER =================
router.get('/me', isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-__v')
      .populate('followers', 'username displayName avatar')
      .populate('following', 'username displayName avatar');

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user data'
    });
  }
});

// ================= UPDATE PROFILE =================
router.put('/profile', isAuthenticated, async (req, res) => {
  try {
    const updateData = { ...req.body };

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).select('-__v');

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating profile'
    });
  }
});

// ================= LOGOUT =================
router.post('/logout', isAuthenticated, (req, res) => {
  res.clearCookie('token');
  res.json({ success: true, message: 'Logged out successfully' });
});

// ================= REFRESH TOKEN =================
router.post('/refresh', isAuthenticated, (req, res) => {
  const token = generateToken(req.user._id);

  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  res.json({ success: true });
});

// ================= CHECK USERNAME =================
router.get('/check-username/:username', async (req, res) => {
  try {
    const existingUser = await User.findOne({
      username: req.params.username.toLowerCase()
    });

    res.json({
      success: true,
      available: !existingUser
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error checking username'
    });
  }
});

export default router;
