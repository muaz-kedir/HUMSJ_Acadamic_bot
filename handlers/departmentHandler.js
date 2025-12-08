/**
 * ================================
 * Department Handler
 * ================================
 * 
 * Triggered when user selects a college.
 * Shows all departments belonging to that college.
 */

const { Markup } = require('telegraf');
const College = require('../db/schemas/College');
const Department = require('../db/schemas/Department');
const { updateSession, getNavigationPath } = require('../utils/sessionManager');

/**
 * Handle college selection - Show departments
 * @param {Object} ctx - Telegraf context
 */
async function handleCollegeSelect(ctx) {
  try {
    // Acknowledge callback query
    await ctx.answerCbQuery();
    
    // Extract college ID from callback data
    const collegeId = ctx.callbackQuery.data.replace('college_', '');
    
    // Fetch college details
    const college = await College.findById(collegeId);
    if (!college) {
      return ctx.reply('❌ College not found. Please try again.');
    }
    
    // Update session
    updateSession(ctx.chat.id, {
      collegeId: college._id,
      collegeName: college.name,
      departmentId: null,
      departmentName: null,
      year: null,
      semester: null
    });
    
    // Fetch departments for this college
    const departments = await Department.find({ collegeId: college._id }).sort({ name: 1 });
    
    // Check if departments exist
    if (!departments || departments.length === 0) {
      return ctx.editMessageText(
        `🏛️ *${college.name}*\n\n` +
        '📭 No departments found in this college.',
        { parse_mode: 'Markdown' }
      );
    }
    
    // Build inline keyboard with department buttons
    const buttons = departments.map(dept => [
      Markup.button.callback(
        `📁 ${dept.name}`,
        `department_${dept._id}`
      )
    ]);
    
    // Add back button
    buttons.push([Markup.button.callback('⬅️ Back to Colleges', 'back_colleges')]);
    
    // Edit message with departments
    await ctx.editMessageText(
      `🏛️ *${college.name}*\n\n` +
      'Select a department:',
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard(buttons)
      }
    );
    
    console.log(`👤 User selected college: ${college.name}`);
    
  } catch (error) {
    console.error('❌ Department handler error:', error.message);
    await ctx.answerCbQuery('An error occurred');
    await ctx.reply('❌ An error occurred. Please try /browse again.');
  }
}

module.exports = { handleCollegeSelect };
