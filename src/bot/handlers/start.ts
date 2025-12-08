import { Context } from 'grammy';
import prisma from '../../db/prisma';

export async function startHandler(ctx: Context) {
  const user = ctx.from;

  if (!user) {
    await ctx.reply('Unable to identify user.');
    return;
  }

  try {
    // Store or update user in database
    const dbUser = await prisma.user.upsert({
      where: { telegramId: BigInt(user.id) },
      update: {
        username: user.username,
        firstName: user.first_name,
        lastName: user.last_name,
        languageCode: user.language_code,
        isBot: user.is_bot,
      },
      create: {
        telegramId: BigInt(user.id),
        username: user.username,
        firstName: user.first_name,
        lastName: user.last_name,
        languageCode: user.language_code,
        isBot: user.is_bot,
      },
    });

    console.log('User stored in database:', dbUser);

    const welcomeMessage = `
👋 Welcome ${user.first_name}!

I'm a Telegram bot built with:
• Node.js + TypeScript
• grammY Framework
• PostgreSQL + Prisma
• Deployed on Render

Your user ID: ${user.id}
Database ID: ${dbUser.id}

Try sending me any message and I'll echo it back!
    `.trim();

    await ctx.reply(welcomeMessage);
  } catch (error) {
    console.error('Error in start handler:', error);
    throw error;
  }
}
