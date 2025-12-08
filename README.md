# Telegram Bot Starter Template

Production-ready Telegram Bot built with Node.js, TypeScript, PostgreSQL, Prisma, and grammY.

## Features

- 🤖 **grammY Framework** - Modern Telegram Bot API framework
- 📘 **TypeScript** - Full type safety
- 🗄️ **PostgreSQL + Prisma** - Robust database with type-safe ORM
- 🚀 **Render Deployment** - Ready-to-deploy configuration
- 🔄 **Webhook & Polling** - Supports both modes
- ✨ **ESLint + Prettier** - Code quality tools
- 🛡️ **Error Handling** - Global error middleware
- 📊 **Health Checks** - Monitor bot status

## Prerequisites

- Node.js 18+ 
- PostgreSQL database
- Telegram Bot Token (get from [@BotFather](https://t.me/botfather))

## Quick Start

### Automated Setup (Recommended)

```bash
# Run the setup script
./setup.sh
```

This will:
- ✅ Configure your bot token
- ✅ Set up database (Docker or custom)
- ✅ Install dependencies
- ✅ Run migrations
- ✅ Get you ready to code!

### Manual Setup

1. **Install Dependencies**
```bash
npm install
```

2. **Setup Environment**
```bash
cp .env.example .env
# Edit .env with your bot token and database URL
```

3. **Setup Database**
```bash
# Option A: Docker (recommended)
./start-db.sh

# Option B: Use your own PostgreSQL
# Just update DATABASE_URL in .env
```

4. **Initialize Database**
```bash
npm run prisma:generate
npm run prisma:migrate
```

5. **Start Development**
```bash
npm run dev
```

The bot will start in polling mode for local development.

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run prisma:generate` - Generate Prisma Client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:seed` - Seed database with test data
- `npm run prisma:studio` - Open Prisma Studio (database GUI)
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## Project Structure

```
.
├── src/
│   ├── bot/
│   │   ├── handlers/          # Command and message handlers
│   │   │   ├── start.ts       # /start command
│   │   │   └── echo.ts        # Echo message handler
│   │   ├── middlewares/       # Bot middlewares
│   │   │   ├── error.ts       # Global error handler
│   │   │   └── logger.ts      # Request logger
│   │   └── bot.ts             # Bot initialization
│   ├── server/
│   │   └── index.ts           # Express server + webhook
│   ├── db/
│   │   └── prisma.ts          # Prisma client singleton
│   └── config.ts              # Configuration management
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts                # Database seeding
├── render.yaml                # Render deployment config
├── Dockerfile                 # Docker configuration
└── package.json
```

## Deployment to Render

### Option 1: Using render.yaml (Recommended)

1. Push your code to GitHub
2. Connect your repository to Render
3. Render will automatically detect `render.yaml`
4. Add your `BOT_TOKEN` in Render dashboard
5. Deploy!

### Option 2: Manual Setup

1. Create a new PostgreSQL database on Render
2. Create a new Web Service on Render
3. Set environment variables:
   - `BOT_TOKEN` - Your bot token
   - `DATABASE_URL` - Auto-filled from database
   - `WEBHOOK_URL` - Your Render app URL + `/webhook`
   - `NODE_ENV` - `production`
4. Set build command: `npm install && npm run prisma:generate && npm run build`
5. Set start command: `npm run prisma:migrate && npm start`

### Setting Up Webhook

After deployment, your bot will automatically set the webhook to:
```
https://your-app.onrender.com/webhook
```

To verify webhook is set:
```bash
curl https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo
```

## Bot Commands

- `/start` - Start the bot and register user in database

## Database Schema

### User Model

```prisma
model User {
  id           Int      @id @default(autoincrement())
  telegramId   BigInt   @unique
  username     String?
  firstName    String?
  lastName     String?
  languageCode String?
  isBot        Boolean  @default(false)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

## Development Tips

### Local Development

The bot runs in **polling mode** locally (no webhook needed). Just run:
```bash
npm run dev
```

### Production Mode

In production (when `WEBHOOK_URL` is set), the bot uses **webhook mode** for better performance.

### Database Management

View and edit your database with Prisma Studio:
```bash
npm run prisma:studio
```

### Adding New Commands

1. Create handler in `src/bot/handlers/`
2. Register in `src/bot/bot.ts`

Example:
```typescript
// src/bot/handlers/help.ts
export async function helpHandler(ctx: Context) {
  await ctx.reply('Help message here');
}

// src/bot/bot.ts
import { helpHandler } from './handlers/help';
bot.command('help', helpHandler);
```

## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `BOT_TOKEN` | Telegram Bot Token from @BotFather | Yes | - |
| `DATABASE_URL` | PostgreSQL connection string | Yes | - |
| `PORT` | Server port | No | 3000 |
| `NODE_ENV` | Environment (development/production) | No | development |
| `WEBHOOK_URL` | Webhook URL for production | No | - |

## Troubleshooting

### Bot not responding

1. Check if `BOT_TOKEN` is correct
2. Verify bot is running: `curl http://localhost:3000/health`
3. Check logs for errors

### Database connection issues

1. Verify `DATABASE_URL` is correct
2. Ensure PostgreSQL is running
3. Run migrations: `npm run prisma:migrate`

### Webhook not working

1. Ensure `WEBHOOK_URL` is set correctly
2. Check webhook status: `https://api.telegram.org/bot<TOKEN>/getWebhookInfo`
3. Verify `/webhook` endpoint is accessible

## License

MIT
# botCreating
# HUMSJ_Acadamic_bot
