/**
 * ================================
 * Rate Limiter
 * ================================
 * 
 * Prevents spam by limiting requests per user.
 * Max 20 requests per minute per user.
 */

const userRequests = new Map();
const MAX_REQUESTS = 20;
const WINDOW_MS = 60000; // 1 minute

/**
 * Check if user is rate limited
 * @param {string} oduserId - Telegram user ID
 * @returns {Object} { allowed: boolean, remaining: number, resetIn: number }
 */
function checkRateLimit(oduserId) {
  const now = Date.now();
  const userKey = oduserId.toString();
  
  if (!userRequests.has(userKey)) {
    userRequests.set(userKey, { count: 1, windowStart: now });
    return { allowed: true, remaining: MAX_REQUESTS - 1, resetIn: 0 };
  }
  
  const userData = userRequests.get(userKey);
  
  // Reset window if expired
  if (now - userData.windowStart > WINDOW_MS) {
    userRequests.set(userKey, { count: 1, windowStart: now });
    return { allowed: true, remaining: MAX_REQUESTS - 1, resetIn: 0 };
  }
  
  // Check if limit exceeded
  if (userData.count >= MAX_REQUESTS) {
    const resetIn = Math.ceil((WINDOW_MS - (now - userData.windowStart)) / 1000);
    return { allowed: false, remaining: 0, resetIn };
  }
  
  // Increment count
  userData.count++;
  return { allowed: true, remaining: MAX_REQUESTS - userData.count, resetIn: 0 };
}

/**
 * Rate limit middleware for Telegraf
 */
function rateLimitMiddleware() {
  return async (ctx, next) => {
    if (!ctx.from) return next();
    
    const result = checkRateLimit(ctx.from.id);
    
    if (!result.allowed) {
      return ctx.reply(
        `⛔ *Too many requests!*\n\n` +
        `Please wait ${result.resetIn} seconds before trying again.`,
        { parse_mode: 'Markdown' }
      );
    }
    
    return next();
  };
}

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of userRequests.entries()) {
    if (now - data.windowStart > WINDOW_MS * 2) {
      userRequests.delete(key);
    }
  }
}, 300000);

module.exports = { checkRateLimit, rateLimitMiddleware };
