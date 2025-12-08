/**
 * ================================
 * Year Handler
 * ================================
 * 
 * Triggered when user selects a department.
 * Shows year options (Year 1-4).
 */

const { Markup } = require('telegraf');
const Department = require('../db/schemas/Department');
const { updateSession, getSession, getNavigationPath } = require('../utils/sessionManager');

/**
 * Handle department selection - Show years
 * @param {Object} ctx - Telegraf context
 */
async function handleDepartmentSelect(ctx) {
  try {
    // Acknowledge callback query
    await ctx.answerCbQuery();
    
    // Extract department ID from callback data
    const departmentId = ctx.callbackQuery.data.replace('department_', '');
    
    // Fetch department details
    const department = await Department.findById(departmentId);
    if (!department) {
      return ctx.reply('❌ Department not found. Please try again.');
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
    
    // Build year selection buttons
    const buttons = [
      [
        Markup.button.callback('📅 Year 1', 'year_1'),
        Markup.button.callback('📅 Year 2', 'year_2')
      ],
      [
        Markup.button.callback('📅 Year 3', 'year_3'),
        Markup.button.callback('📅 Year 4', 'year_4')
      ],
      [Markup.button.callback('⬅️ Back to Departments', `college_${getSession(ctx.chat.id).collegeId}`)]
    ];
    
    // Edit message with year options
    await ctx.editMessageText(
      `📁 *${department.name}*\n` +
      `📍 ${navPath}\n\n` +
      'Select your year:',
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard(buttons)
      }
    );
    
    console.log(`👤 User selected department: ${department.name}`);
    
  } catch (error) {
    console.error('❌ Year handler error:', error.message);
    await ctx.answerCbQuery('An error occurred');
    await ctx.reply('❌ An error occurred. Please try /browse again.');
  }
}

module.exports = { handleDepartmentSelect };
