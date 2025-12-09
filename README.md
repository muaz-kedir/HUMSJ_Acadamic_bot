# HUMSJ Academic Library Bot 📚

A Telegram bot for accessing academic resources at HUMSJ (Haramaya University Maddaa Jireenyaa Campus).

## Features

- 📚 Browse colleges, departments, and courses
- 🔍 Search resources by keyword
- ⭐ Save favorites for quick access
- 🕘 View browsing history
- 📄 PDF preview and download
- 🗜️ ZIP download option
- 📊 Usage statistics and analytics
- 📢 Admin broadcast system
- 🔔 Notification for new content

## Quick Start

### Prerequisites

- Node.js 18+ 
- MongoDB (local or Atlas)
- Telegram Bot Token (from @BotFather)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/humsj-telegram-bot.git
cd humsj-telegram-bot

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your credentials
# BOT_TOKEN=your_bot_token
# MONGO_URI=your_mongodb_uri
# ADMIN_IDS=your_telegram_id

# Seed the database
npm run seed

# Start the bot
npm run dev
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `BOT_TOKEN` | Telegram bot token from @BotFather | Yes |
| `MONGO_URI` | MongoDB connection string | Yes |
| `NODE_ENV` | Environment (development/production) | No |
| `ADMIN_IDS` | Comma-separated admin Telegram IDs | No |
| `PORT` | Health check server port | No |
| `LOG_LEVEL` | Logging level (debug/info/warn/error) | No |

## Commands

### User Commands
- `/start` - Home menu
- `/browse` - Browse colleges
- `/search <keyword>` - Search resources
- `/favorites` - View saved items
- `/history` - View browsing history
- `/stats` - View statistics
- `/help` - Get help

### Admin Commands
- `/broadcast <message>` - Send message to all users
- `/analytics` - View detailed analytics

## Project Structure

```
humsj-telegram-bot/
├── bot.js              # Main entry point
├── server.js           # Health check server
├── package.json
├── .env.example
├── db/
│   ├── mongoose.js     # Database connection
│   └── schemas/        # MongoDB schemas
├── handlers/           # Bot command handlers
├── utils/              # Utility functions
├── scripts/            # Maintenance scripts
└── uploads/            # Resource files
    ├── pdf/
    ├── slides/
    ├── books/
    └── exams/
```

## Deployment

### Deploy to Render (Recommended - Free)

1. Push code to GitHub
2. Go to [render.com](https://render.com)
3. Create new Web Service
4. Connect your GitHub repo
5. Configure:
   - Build Command: `npm install`
   - Start Command: `npm start`
6. Add environment variables
7. Deploy!

### Environment Variables on Render

Add these in the Render dashboard:
- `BOT_TOKEN`
- `MONGO_URI` (use MongoDB Atlas for production)
- `NODE_ENV=production`
- `ADMIN_IDS`

## Maintenance

### Backup Database
```bash
npm run backup
```

### Cleanup Temp Files
```bash
npm run cleanup
```

### Health Check
Access `http://your-server:3000/health` for status.

## Admin Guide

### Getting Your Telegram ID
1. Message @userinfobot on Telegram
2. Copy the ID number
3. Add to `ADMIN_IDS` in .env

### Broadcasting Messages
```
/broadcast Your announcement message here
```

### Viewing Analytics
```
/analytics
```

## Troubleshooting

### Bot not responding
- Check BOT_TOKEN is correct
- Ensure MongoDB is running
- Check logs for errors

### Database connection failed
- Verify MONGO_URI format
- Check network/firewall settings
- For Atlas: whitelist your IP

### Files not sending
- Check file paths in database
- Verify files exist in uploads/
- Check file size (max 50MB for Telegram)

## License

MIT License

## Support

For issues or questions, contact the HUMSJ Library team.
