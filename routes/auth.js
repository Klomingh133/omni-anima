const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const supabase = require('../db/connection');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please wait a moment and try again.' }
});

router.post('/register', authLimiter, async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || username.length < 3 || username.length > 50) {
      return res.status(400).json({ success: false, message: 'Username must be between 3 and 50 characters.' });
    }
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email address format.' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    const { data: existingUsers, error: existingError } = await supabase
      .from('users')
      .select('id')
      .or(`username.eq.${username},email.eq.${email}`);

    if (existingError) {
      throw existingError;
    }

    if (existingUsers && existingUsers.length > 0) {
      return res.status(409).json({ success: false, message: 'Username or email is already registered.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = crypto.randomUUID();

    const { data, error } = await supabase
      .from('users')
      .insert([{ id: userId, username, email, password_hash: passwordHash }])
      .select('id, username, email, avatar_url')
      .single();

    if (error) {
      throw error;
    }

    const user = { id: data.id, username: data.username, email: data.email, avatar_url: data.avatar_url };
    const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      success: true,
      data: { token, user }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Internal server error during registration.' });
  }
});

// Login
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { login, password } = req.body;

    if (!login || !password) {
      return res.status(400).json({ success: false, message: 'Please provide both username/email and password.' });
    }

    const { data: users, error } = await supabase
      .from('users')
      .select('id, username, email, password_hash, avatar_url')
      .or(`username.eq.${login},email.eq.${login}`);

    if (error) throw error;
    if (!users || users.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const userRecord = users[0];
    const match = await bcrypt.compare(password, userRecord.password_hash);

    if (!match) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const user = { id: userRecord.id, username: userRecord.username, email: userRecord.email, avatar_url: userRecord.avatar_url };
    const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      data: { token, user }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Internal server error during sign in.' });
  }
});

// Get Current User (Refresh)
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, email, avatar_url')
      .eq('id', req.user.id)
      .single();

    if (error || !data) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.json({ success: true, data: { ...data, user: data } });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve user profile.' });
  }
});

// Update Avatar
router.put('/avatar', authenticateToken, async (req, res) => {
  try {
    const { avatar_url } = req.body;
    if (!avatar_url) return res.status(400).json({ success: false, message: 'Invalid avatar image data.' });

    const { error } = await supabase
      .from('users')
      .update({ avatar_url })
      .eq('id', req.user.id);

    if (error) throw error;

    res.json({ success: true, avatar_url });
  } catch (error) {
    console.error('Avatar update error:', error);
    res.status(500).json({ success: false, message: 'Failed to update profile photo.' });
  }
});

module.exports = router;
