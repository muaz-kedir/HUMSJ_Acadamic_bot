/**
 * ================================
 * College Handler (Day 11 Enhanced)
 * ================================
 * 
 * Handles /browse command with polished UI.
 * First step: College → Department → Year → Semester → Course
 */

const { Markup } = require('telegraf');
const College = require('../db/schemas/College');
const { clearSession } = require('../utils/sessionManager');
const {
  EMOJI,
  HEADERS,
  EMPTY,
  ERRORS,
  NAV,
  showTyping,
  safeAnswerCallback
} = require('../utils/branding');

/**
 * Handle /browse command - Show all colleges
 */
async function handleBrowse(ctx) {
  try {
    // Clear previous session when starting fresh
    clearSession(ctx.chat.id);
    
    // Show typing indicator
    await showTyping(ctx);
    
    // Fetch all colleges from database
    const colleges = await College.find({}).sort({ name: 1 });
    
    // Check if colleges exist
    if (!colleges || colleges.length === 0) {
      return ctx.reply(EMPTY.colleges, { parse_mode: 'Markdown' });
    }
    
    // Build inline keyboard with college buttons
    const buttons = colleges.map(college => [
      Markup.button.callback(
        `${EMOJI.college} ${college.name}`,
        `college_${college._id}`
      )
    ]);
    
    // Add navigation buttons
    buttons.push([
      Markup.button.callback(NAV.home, 'go_home'),
      Markup.button.callback(NAV.search, 'go_search')
    ]);
    
    // Send message with keyboard
    await ctx.reply(HEADERS.selectCollege, {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard(buttons)
    });
    
    console.log(`👤 User ${ctx.from.username || ctx.from.id} started browsing`);
    
  } catch (error) {
    console.error('❌ College handler error:', error.message);
    await ctx.reply(ERRORS.general);
  }
}

module.exports = { handleBrowse };
