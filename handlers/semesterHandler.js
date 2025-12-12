/**
 * ================================
 * Semester Handler (Day 11 Enhanced)
 * ================================
 * 
 * Shows semester options when user selects a year.
 * Clean UI with back navigation.
 */

const { Markup } = require('telegraf');
const { updateSession, getSession, getNavigationPath } = require('../utils/sessionManager');
const {
  EMOJI,
  HEADERS,
  ERRORS,
  NAV,
  formatBreadcrumb,
  showTyping,
  safeEditMessage,
  safeAnswerCallback
} = require('../utils/branding');

/**
 * Handle year selection - Show semesters
 */
async function handleYearSelect(ctx) {
  try {
    await safeAnswerCallback(ctx, EMOJI.loading);
    
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
        Markup.button.callback(`${EMOJI.semester} Semester 1`, 'semester_1'),
        Markup.button.callback(`📗 Semester 2`, 'semester_2')
      ],
      [Markup.button.callback(NAV.backTo('Years'), `department_${session.departmentId}`)],
      [
        Markup.button.callback(NAV.home, 'go_home'),
        Markup.button.callback(NAV.search, 'go_search')
      ]
    ];
    
    const message = `${HEADERS.selectSemester(year)}\n\n${formatBreadcrumb(navPath)}`;
    
    // Edit message with semester options
    await safeEditMessage(ctx, message, {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard(buttons)
    });
    
    console.log(`👤 User selected year: ${year}`);
    
  } catch (error) {
    console.error('❌ Semester handler error:', error.message);
    await ctx.reply(ERRORS.general);
  }
}

module.exports = { handleYearSelect };
