# HAGD Bot - Telegram Mini App

A comprehensive Telegram Mini App for earning HAGD coins through ads, bonuses, referrals, and withdrawals.

## Features

### 🎯 Earn Section
- **Watch Ad**: Earn 5 HAGD coins by watching interstitial ads (30s cooldown)
- **Daily Bonus**: Claim random bonus of 5-50 HAGD coins (1-hour cooldown)

### 💰 Wallet Section
- View HAGD balance and USDT equivalent (1 USDT = 1000 HAGD)
- Withdrawal system with minimum 1000 HAGD
- Withdrawal history tracking
- Binance UID integration

### 👥 Refer Section
- Unique referral links for each user
- 50 HAGD reward per successful referral
- 5% commission on referrals' withdrawals
- Referral statistics dashboard

### 🔧 Admin Panel
- Secure admin authentication
- Manual withdrawal approval/rejection
- User balance management
- Platform statistics

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT tokens
- **Telegram**: Telegram Bot API
- **Ads**: LibTL interstitial ad SDK
- **Frontend**: Vanilla JavaScript, CSS3

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Update the `.env` file with your settings:
```env
TELEGRAM_BOT_TOKEN=8122669333:AAEWZB7CpZnmwO1SW2b3EWhfg0i8RV4AVhQ
MONGODB_URI=mongodb://localhost:27017/hagd-bot
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
ADMIN_PASSWORD=admin123
PORT=3000
NODE_ENV=development
APP_URL=https://your-domain.com
```

### 3. Database Setup
Make sure MongoDB is running locally or update `MONGODB_URI` with your MongoDB Atlas connection string.

### 4. Telegram Bot Setup
1. Create a bot with @BotFather on Telegram
2. Set the bot token in `.env`
3. Configure the bot's menu button to open your web app
4. Set webhook URL (for production)

### 5. Run the Application
```bash
# Development
npm run dev

# Production
npm start
```

## Deployment Options

### Render
1. Connect your GitHub repository
2. Set environment variables
3. Deploy as a web service

### Vercel
1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` in project directory
3. Configure environment variables

### InfinityFree
1. Upload files via FTP
2. Configure database connection
3. Set up cron jobs for bot polling

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login via Telegram ID
- `POST /api/auth/admin-login` - Admin authentication

### User Operations
- `GET /api/user/profile` - Get user profile
- `POST /api/user/watch-ad` - Process ad reward
- `POST /api/user/claim-bonus` - Claim daily bonus
- `POST /api/user/withdraw` - Request withdrawal
- `GET /api/user/withdrawals` - Get withdrawal history
- `GET /api/user/referrals` - Get referral statistics

### Admin Operations
- `GET /api/admin/withdrawals` - Get all withdrawal requests
- `PUT /api/admin/withdrawals/:id` - Update withdrawal status
- `GET /api/admin/users` - Get all users
- `PUT /api/admin/users/:id/balance` - Update user balance
- `GET /api/admin/stats` - Get platform statistics

## Security Features

- JWT token authentication
- Admin password protection
- Input validation and sanitization
- Rate limiting on sensitive endpoints
- Secure withdrawal processing

## Ad Integration

The app uses LibTL's interstitial ad SDK:
```html
<script src='//libtl.com/sdk.js' data-zone='9613656' data-sdk='show_9613656'></script>
```

Ads are triggered before rewards using:
```javascript
show_9613656().then(() => {
  // Process reward
});
```

## Database Schema

### User Model
- Telegram ID and profile information
- HAGD balance tracking
- Referral system data
- Withdrawal history
- Cooldown timestamps

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, contact the development team or create an issue in the repository.
