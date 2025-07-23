const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// Middleware to verify JWT token
const verifyToken = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ telegramId: decoded.telegramId });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(400).json({ error: 'Invalid token' });
  }
};

// Get user profile
router.get('/profile', verifyToken, (req, res) => {
  res.json({
    telegramId: req.user.telegramId,
    username: req.user.username,
    firstName: req.user.firstName,
    hagdBalance: req.user.hagdBalance,
    referralCode: req.user.referralCode,
    totalReferrals: req.user.referrals.length,
    totalReferralEarnings: req.user.totalReferralEarnings,
    lastAdWatch: req.user.lastAdWatch,
    lastBonusClaim: req.user.lastBonusClaim
  });
});

// Watch ad and earn HAGD
router.post('/watch-ad', verifyToken, async (req, res) => {
  try {
    const now = new Date();
    const lastAdWatch = req.user.lastAdWatch;
    
    // Check 30-second cooldown
    if (lastAdWatch && (now - lastAdWatch) < 30000) {
      const remainingTime = Math.ceil((30000 - (now - lastAdWatch)) / 1000);
      return res.status(400).json({ 
        error: 'Cooldown active', 
        remainingTime 
      });
    }

    // Add 5 HAGD coins
    req.user.hagdBalance += 5;
    req.user.lastAdWatch = now;
    await req.user.save();

    res.json({
      success: true,
      message: 'Ad watched successfully!',
      reward: 5,
      newBalance: req.user.hagdBalance
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to process ad reward' });
  }
});

// Claim bonus
router.post('/claim-bonus', verifyToken, async (req, res) => {
  try {
    const now = new Date();
    const lastBonusClaim = req.user.lastBonusClaim;
    
    // Check 1-hour cooldown
    if (lastBonusClaim && (now - lastBonusClaim) < 3600000) {
      const remainingTime = Math.ceil((3600000 - (now - lastBonusClaim)) / 1000);
      return res.status(400).json({ 
        error: 'Bonus cooldown active', 
        remainingTime 
      });
    }

    // Random bonus between 5-50 HAGD
    const bonusAmount = Math.floor(Math.random() * 46) + 5;
    
    req.user.hagdBalance += bonusAmount;
    req.user.lastBonusClaim = now;
    await req.user.save();

    res.json({
      success: true,
      message: 'Bonus claimed successfully!',
      reward: bonusAmount,
      newBalance: req.user.hagdBalance
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to process bonus claim' });
  }
});

// Request withdrawal
router.post('/withdraw', verifyToken, async (req, res) => {
  try {
    const { amount, binanceUid } = req.body;
    
    if (!amount || !binanceUid) {
      return res.status(400).json({ error: 'Amount and Binance UID are required' });
    }

    if (amount < 1000) {
      return res.status(400).json({ error: 'Minimum withdrawal is 1000 HAGD' });
    }

    if (req.user.hagdBalance < amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Deduct balance and create withdrawal request
    req.user.hagdBalance -= amount;
    req.user.withdrawals.push({
      amount,
      binanceUid,
      status: 'pending'
    });

    // Process referral commission (5% to referrer)
    if (req.user.referredBy) {
      const referrer = await User.findOne({ telegramId: req.user.referredBy });
      if (referrer) {
        const commission = Math.floor(amount * 0.05);
        referrer.hagdBalance += commission;
        referrer.totalReferralEarnings += commission;
        await referrer.save();
      }
    }

    await req.user.save();

    res.json({
      success: true,
      message: 'Withdrawal request submitted successfully',
      newBalance: req.user.hagdBalance
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to process withdrawal request' });
  }
});

// Get withdrawal history
router.get('/withdrawals', verifyToken, (req, res) => {
  const withdrawals = req.user.withdrawals.map(w => ({
    amount: w.amount,
    binanceUid: w.binanceUid,
    status: w.status,
    requestedAt: w.requestedAt,
    processedAt: w.processedAt
  }));

  res.json(withdrawals);
});

// Get referral stats
router.get('/referrals', verifyToken, (req, res) => {
  res.json({
    referralCode: req.user.referralCode,
    totalReferrals: req.user.referrals.length,
    totalReferralEarnings: req.user.totalReferralEarnings,
    referrals: req.user.referrals
  });
});

module.exports = router;
