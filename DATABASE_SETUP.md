# Database Setup Guide

## Option 1: Local PostgreSQL (Development)

### Step 1: Install PostgreSQL

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**macOS (Homebrew):**
```bash
brew install postgresql@15
brew services start postgresql@15
```

### Step 2: Create Database

```bash
# Switch to postgres user and open psql
sudo -u postgres psql

# In psql, run these commands:
CREATE DATABASE telegram_bot;
CREATE USER telegram_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE telegram_bot TO telegram_user;
\c telegram_bot
GRANT ALL ON SCHEMA public TO telegram_user;
\q
```

### Step 3: Update .env

```env
DATABASE_URL=postgresql://telegram_user:your_password@localhost:5432/telegram_bot?schema=public
```

### Step 4: Run Migrations

```bash
npm run prisma:generate
npm run prisma:migrate
```

---

## Option 2: Docker PostgreSQL (Easiest)

### Step 1: Create docker-compose.yml

Already created in your project! Just run:

```bash
docker-compose up -d
```

### Step 2: Update .env

```env
DATABASE_URL=postgresql://telegram_user:telegram_password@localhost:5432/telegram_bot?schema=public
```

### Step 3: Run Migrations

```bash
npm run prisma:generate
npm run prisma:migrate
```

---

## Option 3: Cloud Database (Production)

### Render PostgreSQL (Free Tier)

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New +" → "PostgreSQL"
3. Choose free tier
4. Copy the "Internal Database URL"
5. Add to your .env:

```env
DATABASE_URL=<your_render_database_url>
```

### Supabase (Free Tier)

1. Go to [Supabase](https://supabase.com/)
2. Create new project
3. Go to Settings → Database
4. Copy "Connection string" (URI mode)
5. Add to your .env:

```env
DATABASE_URL=<your_supabase_connection_string>
```

### Neon (Free Tier)

1. Go to [Neon](https://neon.tech/)
2. Create new project
3. Copy connection string
4. Add to your .env:

```env
DATABASE_URL=<your_neon_connection_string>
```

---

## Verify Database Connection

After setup, test the connection:

```bash
npm run prisma:generate
npx prisma db push
```

Or open Prisma Studio to view your database:

```bash
npm run prisma:studio
```

---

## Troubleshooting

### "Connection refused"
- Ensure PostgreSQL is running: `sudo systemctl status postgresql`
- Check if port 5432 is open: `sudo netstat -plnt | grep 5432`

### "Password authentication failed"
- Verify credentials in DATABASE_URL
- Reset password: `sudo -u postgres psql -c "ALTER USER telegram_user PASSWORD 'new_password';"`

### "Database does not exist"
- Create it: `sudo -u postgres createdb telegram_bot`

### Permission denied
- Grant privileges: `sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE telegram_bot TO telegram_user;"`
