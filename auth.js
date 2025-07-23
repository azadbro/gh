const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const router = express.Router();

// Middleware to verify Telegram user
const verifyTelegramUser = async (req, res, next) => {
  try {
    const { telegramId } = req.body;
    
    if (!telegramId) {
      return res.status(400).json({ error: 'Telegram ID is required' });
    }

    const user = await User.findOne({ telegramId: telegramId.toString() });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Authentication failed' });
  }
};

// Login user via Telegram
router.post('/login', verifyTelegramUser, (req, res) => {
  try {
    const token = jwt.sign(
      { telegramId: req.user.telegramId },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        telegramId: req.user.telegramId,
        username: req.user.username,
        firstName: req.user.firstName,
        hagdBalance: req.user.hagdBalance,
        referralCode: req.user.referralCode
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// Admin login
router.post('/admin-login', async (req, res) => {
  try {
    const { password } = req.body;
    
    if (password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'Invalid admin password' });
    }

    const token = jwt.sign(
      { isAdmin: true },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      token,
      isAdmin: true
    });
  } catch (error) {
    res.status(500).json({ error: 'Admin login failed' });
  }
});

module.exports = router;
