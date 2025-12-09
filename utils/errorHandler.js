/**
 * ================================
 * Global Error Handler (Day 10)
 * ================================
 * 
 * Centralized error handling with retry logic.
 */

const { log } = require('./logger');

// Admin notification queue
const errorQueue = [];
let lastNotification = 0;
const NOTIFICATION_COOLDOWN = 60000; // 1 minute

/**
 * Notify admin of critical errors
 */
async function notifyAdmin(bot, error, context = {}) {
  const adminIds = process.env.ADMIN_IDS ? process.env.ADMIN_IDS.split(',') : [];
  
  if (adminIds.length === 0) return;
  
  // Rate limit notifications
  const now = Date.now();
  if (now - lastNotification < NOTIFICATION_COOLDOWN) {
    errorQueue.push({ error, context, timestamp: now });
    return;
  }
  
  lastNotification = now;
  
  const message = 
    `🚨 *Bot Error Alert*\n\n` +
    `❌ Error: ${error.message}\n` +
    `📍 Context: ${JSON.stringify(context)}\n` +
    `🕐 Time: ${new Date().toISOString()}\n\n` +
    `_Check logs for details_`;
  
  for (const adminId of adminIds) {
    try {
      await bot.telegram.sendMessage(adminId.trim(), message, { parse_mode: 'Markdown' });
    } catch (e) {
      log.error('Failed to notify admin', { adminId, error: e.message });
    }
  }
}

/**
 * Retry wrapper for async functions
 */
async function withRetry(fn, maxRetries = 3, delay = 1000) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      log.warn(`Attempt ${attempt}/${maxRetries} failed`, { error: error.message });
      
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
  }
  
  throw lastError;
}

/**
 * Safe reply wrapper - handles Telegram API failures
 */
async function safeReply(ctx, message, options = {}) {
  try {
    return await withRetry(() => ctx.reply(message, options), 3, 500);
  } catch (error) {
    log.error('Failed to send message after retries', { error: error.message });
    
    // Try a simpler message
    try {
      await ctx.reply('⚠️ Telegram is experiencing issues. Please try again shortly.');
    } catch (e) {
      // Give up silently
    }
  }
}

/**
 * Safe edit message wrapper
 */
async function safeEditMessage(ctx, message, options = {}) {
  try {
    return await withRetry(() => ctx.editMessageText(message, options), 2, 500);
  } catch (error) {
    // If edit fails, try sending new message
    try {
      await ctx.reply(message, options);
    } catch (e) {
      log.error('Failed to edit or send message', { error: e.message });
    }
  }
}

/**
 * Global error middleware for Telegraf
 */
function errorMiddleware(bot) {
  return async (ctx, next) => {
    try {
      await next();
    } catch (error) {
      log.botError(error, {
        updateType: ctx.updateType,
        userId: ctx.from?.id,
        chatId: ctx.chat?.id
      });
      
      // Notify admin for critical errors
      if (error.code !== 400 && error.code !== 403) {
        await notifyAdmin(bot, error, {
          updateType: ctx.updateType,
          userId: ctx.from?.id
        });
      }
      
      // User-friendly error message
      try {
        await ctx.reply('⚠️ Something went wrong. Please try again.');
      } catch (e) {
        // Can't reply, ignore
      }
    }
  };
}

/**
 * Handle uncaught exceptions
 */
function setupGlobalErrorHandlers(bot) {
  process.on('uncaughtException', async (error) => {
    log.error('Uncaught Exception', { error: error.message, stack: error.stack });
    await notifyAdmin(bot, error, { type: 'uncaughtException' });
    // Don't exit - keep bot running
  });
  
  process.on('unhandledRejection', async (reason, promise) => {
    log.error('Unhandled Rejection', { reason: String(reason) });
    await notifyAdmin(bot, new Error(String(reason)), { type: 'unhandledRejection' });
    // Don't exit - keep bot running
  });
  
  log.info('Global error handlers initialized');
}

module.exports = {
  notifyAdmin,
  withRetry,
  safeReply,
  safeEditMessage,
  errorMiddleware,
  setupGlobalErrorHandlers
};
