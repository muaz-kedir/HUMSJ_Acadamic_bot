import express from 'express';
import { webhookCallback } from 'grammy';
import { config } from '../config';
import { createBot } from '../bot/bot';
import prisma from '../db/prisma';

const app = express();
let bot = createBot();

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'connected',
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
    });
  }
});

// Webhook endpoint for Telegram
app.use(express.json());
app.post('/webhook', webhookCallback(bot, 'express'));

async function startServer() {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected');

    // Recreate bot instance to avoid webhook/polling conflicts
    bot = createBot();

    // Start bot based on environment
    if (config.webhookUrl) {
      // Production: Use webhook mode
      await bot.api.setWebhook(config.webhookUrl);
      console.log(`✅ Webhook set to: ${config.webhookUrl}`);
    } else {
      // Development: Use polling mode
      console.log('⚠️  No WEBHOOK_URL set, starting in polling mode...');
      // Delete webhook if it exists
      await bot.api.deleteWebhook();
      bot.start({
        onStart: () => {
          console.log('✅ Bot started in polling mode');
        },
      });
    }

    // Start Express server
    app.listen(config.port, () => {
      console.log(`✅ Server running on port ${config.port}`);
      console.log(`📊 Health check: http://localhost:${config.port}/health`);
      console.log(`🤖 Bot is ready!`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n⏳ Shutting down gracefully...');
  await bot.stop();
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n⏳ Shutting down gracefully...');
  await bot.stop();
  await prisma.$disconnect();
  process.exit(0);
});

startServer();
