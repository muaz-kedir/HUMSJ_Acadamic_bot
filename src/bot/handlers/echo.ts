import { Context } from 'grammy';

export async function echoHandler(ctx: Context) {
  const messageText = ctx.message?.text;

  if (!messageText) {
    return;
  }

  await ctx.reply(`You said: ${messageText}`);
}
