#!/bin/bash

# Telegram Bot Starter - Setup Script
# This script helps you quickly set up a new bot project

set -e

echo "🤖 Telegram Bot Starter - Setup Script"
echo "========================================"
echo ""

# Check if .env already exists
if [ -f .env ]; then
    echo "⚠️  .env file already exists!"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Setup cancelled."
        exit 0
    fi
fi

# Get bot token
echo "📝 Step 1: Bot Configuration"
echo "Get your bot token from @BotFather on Telegram"
read -p "Enter your BOT_TOKEN: " BOT_TOKEN

if [ -z "$BOT_TOKEN" ]; then
    echo "❌ Bot token is required!"
    exit 1
fi

# Get database configuration
echo ""
echo "📝 Step 2: Database Configuration"
echo "Choose database setup:"
echo "  1) Docker PostgreSQL (recommended for local dev)"
echo "  2) Custom PostgreSQL connection"
read -p "Enter choice (1 or 2): " DB_CHOICE

if [ "$DB_CHOICE" = "1" ]; then
    DATABASE_URL="postgresql://telegram_user:telegram_password@localhost:5433/telegram_bot?schema=public"
    USE_DOCKER=true
elif [ "$DB_CHOICE" = "2" ]; then
    read -p "Enter DATABASE_URL: " DATABASE_URL
    USE_DOCKER=false
else
    echo "❌ Invalid choice!"
    exit 1
fi

# Get server configuration
echo ""
echo "📝 Step 3: Server Configuration"
read -p "Enter PORT (default: 3000): " PORT
PORT=${PORT:-3000}

# Create .env file
cat > .env << EOF
# Telegram Bot Configuration
BOT_TOKEN=$BOT_TOKEN

# Database Configuration
DATABASE_URL=$DATABASE_URL

# Server Configuration
PORT=$PORT
NODE_ENV=development

# Webhook Configuration (for production)
# WEBHOOK_URL=https://your-app.onrender.com/webhook
EOF

echo ""
echo "✅ .env file created!"

# Install dependencies
echo ""
echo "📦 Step 4: Installing dependencies..."
npm install

# Start database if using Docker
if [ "$USE_DOCKER" = true ]; then
    echo ""
    echo "🐳 Step 5: Starting PostgreSQL with Docker..."
    
    # Remove old container if exists
    docker rm -f telegram_bot_db 2>/dev/null || true
    
    # Start new container
    docker run -d \
        --name telegram_bot_db \
        -e POSTGRES_USER=telegram_user \
        -e POSTGRES_PASSWORD=telegram_password \
        -e POSTGRES_DB=telegram_bot \
        -p 5433:5432 \
        postgres:15-alpine
    
    echo "⏳ Waiting for database to be ready..."
    sleep 5
    echo "✅ Database started!"
fi

# Setup Prisma
echo ""
echo "🔧 Step 6: Setting up database schema..."
npm run prisma:generate
npm run prisma:migrate -- --name init

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Start the bot: npm run dev"
echo "  2. Open Telegram and send /start to your bot"
echo "  3. View database: npm run prisma:studio"
echo ""
echo "Happy coding! 🚀"
