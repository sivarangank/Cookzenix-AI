const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { verifyToken } = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'foodrecipes_super_secret_jwt_key_2024';

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', (req, res) => {
  try {
    const { username, email, password, avatar = '', bio = '' } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username, email, and password are required.'
      });
    }

    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (trimmedUsername.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Username must be at least 3 characters long.'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.'
      });
    }

    // Check if email already exists
    const existingEmail = db.prepare('SELECT id FROM users WHERE email = ?').get(trimmedEmail);
    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.'
      });
    }

    // Check if username already exists
    const existingUsername = db.prepare('SELECT id FROM users WHERE username = ?').get(trimmedUsername);
    if (existingUsername) {
      return res.status(409).json({
        success: false,
        message: 'Username is already taken. Please choose another.'
      });
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    const defaultAvatar = avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(trimmedUsername)}`;

    const insertUser = db.prepare(`
      INSERT INTO users (username, email, password_hash, avatar, bio)
      VALUES (?, ?, ?, ?, ?)
    `);

    const result = insertUser.run(trimmedUsername, trimmedEmail, passwordHash, defaultAvatar, bio);
    const newUserId = result.lastInsertRowid;

    const token = jwt.sign(
      { id: newUserId, username: trimmedUsername, email: trimmedEmail },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const newUser = db.prepare('SELECT id, username, email, avatar, bio, created_at FROM users WHERE id = ?').get(newUserId);

    return res.status(201).json({
      success: true,
      message: 'User registered successfully!',
      data: {
        token,
        user: newUser
      }
    });
  } catch (error) {
    console.error('Error during registration:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while processing registration.'
    });
  }
});

/**
 * POST /api/auth/login
 * Log in an existing user
 */
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.'
      });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(trimmedEmail);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const isPasswordValid = bcrypt.compareSync(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const safeUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      bio: user.bio,
      created_at: user.created_at
    };

    return res.status(200).json({
      success: true,
      message: 'Login successful!',
      data: {
        token,
        user: safeUser
      }
    });
  } catch (error) {
    console.error('Error during login:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while logging in.'
    });
  }
});

/**
 * GET /api/auth/profile
 * Get current user profile
 */
router.get('/profile', verifyToken, (req, res) => {
  try {
    const user = db.prepare(`
      SELECT id, username, email, avatar, bio, created_at
      FROM users
      WHERE id = ?
    `).get(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found.'
      });
    }

    return res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving profile.'
    });
  }
});

/**
 * PUT /api/auth/profile
 * Update user profile (username, bio, avatar)
 */
router.put('/profile', verifyToken, (req, res) => {
  try {
    const { username, bio, avatar } = req.body;
    const currentUserId = req.user.id;

    const currentUser = db.prepare('SELECT * FROM users WHERE id = ?').get(currentUserId);
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    let updatedUsername = currentUser.username;
    let updatedBio = currentUser.bio;
    let updatedAvatar = currentUser.avatar;

    if (username && username.trim() !== currentUser.username) {
      const trimmedUsername = username.trim();
      if (trimmedUsername.length < 3) {
        return res.status(400).json({
          success: false,
          message: 'Username must be at least 3 characters long.'
        });
      }
      const existing = db.prepare('SELECT id FROM users WHERE username = ? AND id != ?').get(trimmedUsername, currentUserId);
      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'Username is already taken. Please choose another.'
        });
      }
      updatedUsername = trimmedUsername;
    }

    if (bio !== undefined) {
      updatedBio = bio;
    }

    if (avatar !== undefined) {
      updatedAvatar = avatar;
    }

    db.prepare(`
      UPDATE users
      SET username = ?, bio = ?, avatar = ?
      WHERE id = ?
    `).run(updatedUsername, updatedBio, updatedAvatar, currentUserId);

    const updatedUser = db.prepare(`
      SELECT id, username, email, avatar, bio, created_at
      FROM users
      WHERE id = ?
    `).get(currentUserId);

    // Refresh JWT if username changed
    const token = jwt.sign(
      { id: updatedUser.id, username: updatedUser.username, email: updatedUser.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully!',
      data: {
        token,
        user: updatedUser
      }
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while updating profile.'
    });
  }
});

module.exports = router;
