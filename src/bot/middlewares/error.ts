import { Context, NextFunction } from 'grammy';

export async function errorHandler(ctx: Context, next: NextFunction) {
  try {
    await next();
  } catch (error) {
    console.error('Error in bot handler:', error);
    
    try {
      await ctx.reply('An error occurred while processing your request. Please try again later.');
    } catch (replyError) {
      console.error('Failed to send error message to user:', replyError);
    }
  }
}
