/**
 * ================================
 * College Handler
 * ================================
 * 
 * Handles /browse command and displays all colleges.
 * First step in navigation: College → Department → Year → Semester → Course
 */

const { Markup } = require('telegraf');
const College = require('../db/schemas/College');
const { clearSession } = require('../utils/sessionManager');

/**
 * Handle /browse command - Show all colleges
 * @param {Object} ctx - Telegraf context
 */
async function handleBrowse(ctx) {
  try {
    // Clear previous session when starting fresh
    clearSession(ctx.chat.id);
    
    // Fetch all colleges from database
    const colleges = await College.find({}).sort({ name: 1 });
    
    // Check if colleges exist
    if (!colleges || colleges.length === 0) {
      return ctx.reply('📭 No colleges found. Please try again later.');
    }
    
    // Build inline keyboard with college buttons
    const buttons = colleges.map(college => [
      Markup.button.callback(
        `🏛️ ${college.name}`,
        `college_${college._id}`
      )
    ]);
    
    // Send message with keyboard
    await ctx.reply(
      '📚 *HUMSJ Academic Library*\n\n' +
      'Select a college to browse:',
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard(buttons)
      }
    );
    
    console.log(`👤 User ${ctx.from.username || ctx.from.id} started browsing`);
    
  } catch (error) {
    console.error('❌ College handler error:', error.message);
    await ctx.reply('❌ An error occurred. Please try again later.');
  }
}

module.exports = { handleBrowse };
