require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const TelegramBot = require('node-telegram-bot-api');

const User = require('./models/User');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Initialize Telegram Bot
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

// Bot commands
bot.onText(/\/start(.*)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const telegramId = msg.from.id.toString();
  const referralCode = match[1] ? match[1].trim() : null;

  try {
    let user = await User.findOne({ telegramId });
    
    if (!user) {
      // Create new user
      user = new User({
        telegramId,
        username: msg.from.username || 'Unknown',
        firstName: msg.from.first_name || '',
        lastName: msg.from.last_name || ''
      });

      // Handle referral
      if (referralCode && referralCode.startsWith('HAGD')) {
        const referrer = await User.findOne({ referralCode });
        if (referrer && referrer.telegramId !== telegramId) {
          user.referredBy = referrer.telegramId;
          referrer.referrals.push({
            telegramId,
            username: user.username
          });
          referrer.hagdBalance += 50; // 50 HAGD for referral
          referrer.totalReferralEarnings += 50;
          await referrer.save();
        }
      }

      await user.save();
      
      bot.sendMessage(chatId, `🎉 Welcome to HAGD Bot! 
      
You've been registered successfully!
Your referral code: ${user.referralCode}

Click the button below to open the HAGD Mini App:`, {
        reply_markup: {
          inline_keyboard: [[
            { text: '🚀 Open HAGD App', web_app: { url: `${process.env.APP_URL || 'http://localhost:3000'}?user=${telegramId}` } }
          ]]
        }
      });
    } else {
      bot.sendMessage(chatId, `Welcome back to HAGD Bot! 
      
Your current balance: ${user.hagdBalance} HAGD
Your referral code: ${user.referralCode}

Click the button below to open the HAGD Mini App:`, {
        reply_markup: {
          inline_keyboard: [[
            { text: '🚀 Open HAGD App', web_app: { url: `${process.env.APP_URL || 'http://localhost:3000'}?user=${telegramId}` } }
          ]]
        }
      });
    }
  } catch (error) {
    console.error('Error handling /start command:', error);
    bot.sendMessage(chatId, 'Sorry, something went wrong. Please try again later.');
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);

// Serve the main app
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`HAGD Bot server running on port ${PORT}`);
});
