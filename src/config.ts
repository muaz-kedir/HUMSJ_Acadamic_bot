import dotenv from 'dotenv';

dotenv.config();

interface Config {
  botToken: string;
  databaseUrl: string;
  port: number;
  nodeEnv: string;
  webhookUrl?: string;
}

function getConfig(): Config {
  const botToken = process.env.BOT_TOKEN;
  const databaseUrl = process.env.DATABASE_URL;

  if (!botToken) {
    throw new Error('BOT_TOKEN is required in environment variables');
  }

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required in environment variables');
  }

  return {
    botToken,
    databaseUrl,
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    webhookUrl: process.env.WEBHOOK_URL,
  };
}

export const config = getConfig();
