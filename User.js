const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  telegramId: {
    type: String,
    required: true,
    unique: true
  },
  username: {
    type: String,
    required: true
  },
  firstName: String,
  lastName: String,
  hagdBalance: {
    type: Number,
    default: 0
  },
  referralCode: {
    type: String,
    unique: true,
    required: true
  },
  referredBy: {
    type: String,
    default: null
  },
  referrals: [{
    telegramId: String,
    username: String,
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  totalReferralEarnings: {
    type: Number,
    default: 0
  },
  lastAdWatch: {
    type: Date,
    default: null
  },
  lastBonusClaim: {
    type: Date,
    default: null
  },
  withdrawals: [{
    amount: Number,
    binanceUid: String,
    status: {
      type: String,
      enum: ['pending', 'completed', 'rejected'],
      default: 'pending'
    },
    requestedAt: {
      type: Date,
      default: Date.now
    },
    processedAt: Date,
    adminNote: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Generate unique referral code
userSchema.pre('save', function(next) {
  if (!this.referralCode) {
    this.referralCode = 'HAGD' + Math.random().toString(36).substring(2, 10).toUpperCase();
  }
  next();
});

module.exports = mongoose.model('User', userSchema);
