#!/bin/bash

echo "🗄️  Starting PostgreSQL database..."

# Remove old container if exists
docker rm -f telegram_bot_db 2>/dev/null

# Start PostgreSQL container
docker run -d \
  --name telegram_bot_db \
  -e POSTGRES_USER=telegram_user \
  -e POSTGRES_PASSWORD=telegram_password \
  -e POSTGRES_DB=telegram_bot \
  -p 5433:5432 \
  -v telegram_bot_data:/var/lib/postgresql/data \
  postgres:15-alpine

echo "⏳ Waiting for database to be ready..."
sleep 5

echo "✅ Database started!"
echo ""
echo "Connection details:"
echo "  Host: localhost"
echo "  Port: 5433"
echo "  Database: telegram_bot"
echo "  User: telegram_user"
echo "  Password: telegram_password"
echo ""
echo "Your .env is already configured correctly!"
echo ""
echo "Next steps:"
echo "  1. npm run prisma:generate"
echo "  2. npm run prisma:migrate"
echo "  3. npm run dev"
