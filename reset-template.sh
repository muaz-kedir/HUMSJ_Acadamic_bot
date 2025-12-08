#!/bin/bash

# Reset Template Script
# Use this to clean the template before reusing it for a new project

echo "🧹 Resetting template to clean state..."
echo ""

# Confirm action
read -p "⚠️  This will remove all local data. Continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Reset cancelled."
    exit 0
fi

# Stop running processes
echo "🛑 Stopping running processes..."
pkill -f "ts-node-dev" || true

# Remove .env
if [ -f .env ]; then
    echo "🗑️  Removing .env file..."
    rm .env
fi

# Remove node_modules
if [ -d node_modules ]; then
    echo "🗑️  Removing node_modules..."
    rm -rf node_modules
fi

# Remove dist
if [ -d dist ]; then
    echo "🗑️  Removing dist..."
    rm -rf dist
fi

# Remove Prisma migrations
if [ -d prisma/migrations ]; then
    echo "🗑️  Removing Prisma migrations..."
    rm -rf prisma/migrations
fi

# Stop and remove Docker container
echo "🐳 Removing Docker container..."
docker stop telegram_bot_db 2>/dev/null || true
docker rm telegram_bot_db 2>/dev/null || true
docker volume rm telegram_bot_data 2>/dev/null || true

# Restore .env.example
echo "📝 Ensuring .env.example is clean..."
cat > .env.example << 'EOF'
# Telegram Bot Configuration
BOT_TOKEN=your_bot_token_here

# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/telegram_bot?schema=public

# Server Configuration
PORT=3000
NODE_ENV=development

# Webhook Configuration (for production)
WEBHOOK_URL=https://your-app.onrender.com/webhook
EOF

echo ""
echo "✅ Template reset complete!"
echo ""
echo "The template is now clean and ready to be:"
echo "  • Pushed to a new repository"
echo "  • Shared with others"
echo "  • Used for a new project"
echo ""
echo "To start a new project, run: ./setup.sh"
