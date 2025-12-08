#!/bin/bash

# Setup script for local PostgreSQL database

echo "🗄️  Setting up PostgreSQL database..."

# Create database and user
sudo -u postgres psql << EOF
-- Create database
CREATE DATABASE telegram_bot;

-- Create user (change password as needed)
CREATE USER telegram_user WITH PASSWORD 'your_secure_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE telegram_bot TO telegram_user;

-- Connect to database and grant schema privileges
\c telegram_bot
GRANT ALL ON SCHEMA public TO telegram_user;

EOF

echo "✅ Database created successfully!"
echo ""
echo "Add this to your .env file:"
echo "DATABASE_URL=postgresql://telegram_user:your_secure_password@localhost:5432/telegram_bot?schema=public"
