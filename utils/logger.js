/**
 * ================================
 * Production Logger (Day 10)
 * ================================
 * 
 * Structured logging with pino for production.
 */

const pino = require('pino');

const isProduction = process.env.NODE_ENV === 'production';

const logger = pino({
  level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
  transport: isProduction ? undefined : {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname'
    }
  }
});

// Helper functions
const log = {
  info: (msg, data = {}) => logger.info(data, msg),
  error: (msg, data = {}) => logger.error(data, msg),
  warn: (msg, data = {}) => logger.warn(data, msg),
  debug: (msg, data = {}) => logger.debug(data, msg),
  
  // Bot-specific logging
  userAction: (userId, action, details = {}) => {
    logger.info({ userId, action, ...details }, `User action: ${action}`);
  },
  
  botError: (error, context = {}) => {
    logger.error({ error: error.message, stack: error.stack, ...context }, 'Bot error');
  },
  
  apiCall: (endpoint, status, duration) => {
    logger.info({ endpoint, status, duration }, `API call: ${endpoint}`);
  }
};

module.exports = { logger, log };
