# Using This Template for New Projects

This is a reusable Telegram Bot starter template. Follow these steps to create a new bot project.

## Quick Start (Automated)

```bash
# 1. Clone or copy this template
git clone <your-repo-url> my-new-bot
cd my-new-bot

# 2. Run the setup script
./setup.sh

# 3. Start developing
npm run dev
```

The setup script will:
- ✅ Create your `.env` file with your bot token
- ✅ Install all dependencies
- ✅ Start PostgreSQL (if using Docker)
- ✅ Run database migrations
- ✅ Get you ready to code!

---

## Manual Setup

If you prefer to set up manually:

### 1. Copy Template Files

```bash
# Copy all files except node_modules and dist
cp -r telegram-bot-starter my-new-bot
cd my-new-bot
rm -rf node_modules dist
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your bot token and database URL
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Setup Database

**Option A: Docker (Recommended)**
```bash
./start-db.sh
```

**Option B: Custom PostgreSQL**
- Update `DATABASE_URL` in `.env`
- Ensure PostgreSQL is running

### 5. Initialize Database

```bash
npm run prisma:generate
npm run prisma:migrate
```

### 6. Start Bot

```bash
npm run dev
```

---

## Customizing Your Bot

### Add New Commands

1. Create handler in `src/bot/handlers/mycommand.ts`:
```typescript
import { Context } from 'grammy';

export async function myCommandHandler(ctx: Context) {
  await ctx.reply('Hello from my command!');
}
```

2. Register in `src/bot/bot.ts`:
```typescript
import { myCommandHandler } from './handlers/mycommand';
bot.command('mycommand', myCommandHandler);
```

### Add Database Models

1. Edit `prisma/schema.prisma`:
```prisma
model MyModel {
  id        Int      @id @default(autoincrement())
  name      String
  createdAt DateTime @default(now())
}
```

2. Run migration:
```bash
npm run prisma:migrate
```

### Add Middleware

Create in `src/bot/middlewares/mymiddleware.ts`:
```typescript
import { Context, NextFunction } from 'grammy';

export async function myMiddleware(ctx: Context, next: NextFunction) {
  // Do something before
  await next();
  // Do something after
}
```

Register in `src/bot/bot.ts`:
```typescript
import { myMiddleware } from './middlewares/mymiddleware';
bot.use(myMiddleware);
```

---

## Project Structure

```
.
├── src/
│   ├── bot/
│   │   ├── handlers/       # Command handlers
│   │   ├── middlewares/    # Bot middlewares
│   │   └── bot.ts          # Bot setup
│   ├── server/
│   │   └── index.ts        # Express server
│   ├── db/
│   │   └── prisma.ts       # Database client
│   └── config.ts           # Configuration
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── seed.ts             # Seed data
├── .env                    # Environment variables (gitignored)
├── .env.example            # Environment template
├── setup.sh                # Automated setup script
└── package.json
```

---

## Deployment

### Deploy to Render

1. Push your code to GitHub
2. Connect to Render
3. Render will detect `render.yaml`
4. Add `BOT_TOKEN` in environment variables
5. Deploy!

### Deploy to Other Platforms

1. Set environment variables:
   - `BOT_TOKEN`
   - `DATABASE_URL`
   - `WEBHOOK_URL` (your app URL + `/webhook`)
   - `NODE_ENV=production`

2. Build and start:
```bash
npm run build
npm start
```

---

## Making This Template Better

### Remove Your Bot's Data

Before sharing or reusing:

```bash
# Reset .env to example
cp .env.example .env

# Clear database
docker rm -f telegram_bot_db
docker volume rm telegram_bot_data

# Remove node_modules
rm -rf node_modules dist

# Remove migrations (optional)
rm -rf prisma/migrations
```

### Create a GitHub Template

1. Push to GitHub
2. Go to repository Settings
3. Check "Template repository"
4. Others can now use "Use this template" button

### Publish as npm Package

Create a CLI tool:
```bash
npx create-telegram-bot my-bot
```

---

## Tips for Reusability

1. **Keep .env.example updated** - Add all required variables
2. **Document everything** - Update README.md for your specific bot
3. **Use feature branches** - Keep template clean in main branch
4. **Version your template** - Tag releases (v1.0.0, v1.1.0, etc.)
5. **Test setup script** - Ensure it works on fresh installs

---

## Support

- 📖 [grammY Documentation](https://grammy.dev/)
- 📖 [Prisma Documentation](https://www.prisma.io/docs)
- 🐛 Report issues in your repository
- 💬 Join Telegram bot development communities

Happy bot building! 🤖
