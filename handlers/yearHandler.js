/**
 * ================================
 * Year Handler (Day 11 Enhanced)
 * ================================
 * 
 * Shows year options when user selects a department.
 * Clean UI with back navigation.
 */

const { Markup } = require('telegraf');
const Department = require('../db/schemas/Department');
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
 * Handle department selection - Show years
 */
async function handleDepartmentSelect(ctx) {
  try {
    await safeAnswerCallback(ctx, EMOJI.loading);
    
    // Show typing indicator
    await showTyping(ctx);
    
    // Extract department ID from callback data
    const departmentId = ctx.callbackQuery.data.replace('department_', '');
    
    // Fetch department details
    const department = await Department.findById(departmentId);
    if (!department) {
      return ctx.reply(ERRORS.notFound);
    }
    
    // Update session
    updateSession(ctx.chat.id, {
      departmentId: department._id,
      departmentName: department.name,
      year: null,
      semester: null
    });
    
    // Get navigation path
    const navPath = getNavigationPath(ctx.chat.id);
    const session = getSession(ctx.chat.id);
    
    // Build year selection buttons (2x2 grid)
    const buttons = [
      [
        Markup.button.callback(`${EMOJI.year} Year 1`, 'year_1'),
        Markup.button.callback(`${EMOJI.year} Year 2`, 'year_2')
      ],
      [
        Markup.button.callback(`${EMOJI.year} Year 3`, 'year_3'),
        Markup.button.callback(`${EMOJI.year} Year 4`, 'year_4')
      ],
      [Markup.button.callback(NAV.backTo('Departments'), `college_${session.collegeId}`)],
      [
        Markup.button.callback(NAV.home, 'go_home'),
        Markup.button.callback(NAV.search, 'go_search')
      ]
    ];
    
    const message = `${HEADERS.selectYear(department.name)}\n\n${formatBreadcrumb(navPath)}`;
    
    // Edit message with year options
    await safeEditMessage(ctx, message, {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard(buttons)
    });
    
    console.log(`👤 User selected department: ${department.name}`);
    
  } catch (error) {
    console.error('❌ Year handler error:', error.message);
    await ctx.reply(ERRORS.general);
  }
}

module.exports = { handleDepartmentSelect };
