import { Bot } from 'grammy';
import { config } from '../config';
import { errorHandler } from './middlewares/error';
import { logger } from './middlewares/logger';
import { startHandler } from './handlers/start';
import { echoHandler } from './handlers/echo';

export function createBot() {
  const bot = new Bot(config.botToken);

  // Register middlewares
  bot.use(logger);
  bot.use(errorHandler);

  // Register command handlers
  bot.command('start', startHandler);

  // Register message handlers
  bot.on('message:text', echoHandler);

  // Error handling for the bot itself
  bot.catch((err) => {
    console.error('Bot error:', err);
  });

  return bot;
}
