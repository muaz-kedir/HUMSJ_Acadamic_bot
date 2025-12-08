/**
 * ================================
 * Semester Handler
 * ================================
 * 
 * Triggered when user selects a year.
 * Shows semester options (Semester 1-2).
 */

const { Markup } = require('telegraf');
const { updateSession, getSession, getNavigationPath } = require('../utils/sessionManager');

/**
 * Handle year selection - Show semesters
 * @param {Object} ctx - Telegraf context
 */
async function handleYearSelect(ctx) {
  try {
    // Acknowledge callback query
    await ctx.answerCbQuery();
    
    // Extract year from callback data
    const year = parseInt(ctx.callbackQuery.data.replace('year_', ''));
    
    // Update session
    updateSession(ctx.chat.id, {
      year: year,
      semester: null
    });
    
    // Get session and navigation path
    const session = getSession(ctx.chat.id);
    const navPath = getNavigationPath(ctx.chat.id);
    
    // Build semester selection buttons
    const buttons = [
      [
        Markup.button.callback('📘 Semester 1', 'semester_1'),
        Markup.button.callback('📗 Semester 2', 'semester_2')
      ],
      [Markup.button.callback('⬅️ Back to Years', `department_${session.departmentId}`)]
    ];
    
    // Edit message with semester options
    await ctx.editMessageText(
      `📅 *Year ${year}*\n` +
      `📍 ${navPath}\n\n` +
      'Select your semester:',
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard(buttons)
      }
    );
    
    console.log(`👤 User selected year: ${year}`);
    
  } catch (error) {
    console.error('❌ Semester handler error:', error.message);
    await ctx.answerCbQuery('An error occurred');
    await ctx.reply('❌ An error occurred. Please try /browse again.');
  }
}

module.exports = { handleYearSelect };
