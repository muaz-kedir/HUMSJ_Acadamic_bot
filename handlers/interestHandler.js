/**
 * ================================
 * Interest Handler (Day 10)
 * ================================
 * 
 * Handles "Notify me when available" feature.
 */

const { Markup } = require('telegraf');
const Interest = require('../db/schemas/Interest');
const { log } = require('../utils/logger');

/**
 * Handle notify interest callback
 * Format: notify_interest_<type>_<id>
 */
async function handleNotifyInterest(ctx) {
  try {
    await ctx.answerCbQuery();
    
    const data = ctx.callbackQuery.data.replace('notify_interest_', '');
    const [type, id] = data.split('_');
    const telegramId = ctx.from.id.toString();
    
    // Check if already registered
    const existing = await Interest.findOne({
      telegramId,
      type,
      courseId: type === 'course' ? id : undefined,
      chapter: type === 'chapter' ? id : undefined
    });
    
    if (existing) {
      return ctx.reply(
        '✅ You\'re already on the notification list!\n\n' +
        '_We\'ll notify you when new content is available._',
        { parse_mode: 'Markdown' }
      );
    }
    
    // Create interest record
    await Interest.create({
      telegramId,
      type,
      courseId: type === 'course' ? id : undefined,
      chapter: type === 'chapter' ? decodeURIComponent(id) : undefined
    });
    
    await ctx.reply(
      '🔔 *Notification Set!*\n\n' +
      'We\'ll notify you when new resources are added.\n\n' +
      '_Thank you for your interest!_',
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('🏠 Home', 'go_home')]
        ])
      }
    );
    
    log.userAction(telegramId, 'interest_registered', { type, id });
    
  } catch (error) {
    log.error('Interest handler error', { error: error.message });
    await ctx.reply('⚠️ Failed to register interest. Please try again.');
  }
}

/**
 * Notify interested users when content is added
 * Called when admin adds new resources
 */
async function notifyInterestedUsers(bot, courseId, chapter) {
  try {
    const interests = await Interest.find({
      $or: [
        { type: 'course', courseId, notified: false },
        { type: 'chapter', chapter, notified: false }
      ]
    });
    
    if (interests.length === 0) return;
    
    const message = 
      '🎉 *New Content Available!*\n\n' +
      'Resources you were waiting for have been added.\n\n' +
      'Use /browse to check them out!';
    
    let notified = 0;
    
    for (const interest of interests) {
      try {
        await bot.telegram.sendMessage(interest.telegramId, message, {
          parse_mode: 'Markdown'
        });
        
        await Interest.findByIdAndUpdate(interest._id, { notified: true });
        notified++;
        
        // Rate limit
        if (notified % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (e) {
        // User may have blocked bot
        await Interest.findByIdAndDelete(interest._id);
      }
    }
    
    log.info('Notified interested users', { count: notified });
    
  } catch (error) {
    log.error('Notify interested users error', { error: error.message });
  }
}

module.exports = {
  handleNotifyInterest,
  notifyInterestedUsers
};
