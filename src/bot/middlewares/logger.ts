import { Context, NextFunction } from 'grammy';

export async function logger(ctx: Context, next: NextFunction) {
  const start = Date.now();
  const userId = ctx.from?.id;
  const username = ctx.from?.username;
  const messageText = ctx.message?.text || ctx.callbackQuery?.data || 'N/A';

  console.log(`[${new Date().toISOString()}] User ${userId} (@${username}): ${messageText}`);

  await next();

  const duration = Date.now() - start;
  console.log(`[${new Date().toISOString()}] Request processed in ${duration}ms`);
}
