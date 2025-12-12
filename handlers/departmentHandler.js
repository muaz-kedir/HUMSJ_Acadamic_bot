/**
 * ================================
 * Department Handler (Day 11 Enhanced)
 * ================================
 * 
 * Shows departments when user selects a college.
 * Includes loading states and back navigation.
 */

const { Markup } = require('telegraf');
const College = require('../db/schemas/College');
const Department = require('../db/schemas/Department');
const { updateSession } = require('../utils/sessionManager');
const {
  EMOJI,
  HEADERS,
  EMPTY,
  ERRORS,
  NAV,
  showTyping,
  safeEditMessage,
  safeAnswerCallback
} = require('../utils/branding');

/**
 * Handle college selection - Show departments
 */
async function handleCollegeSelect(ctx) {
  try {
    await safeAnswerCallback(ctx, EMOJI.loading);
    
    // Show typing indicator
    await showTyping(ctx);
    
    // Extract college ID from callback data
    const collegeId = ctx.callbackQuery.data.replace('college_', '');
    
    // Fetch college details
    const college = await College.findById(collegeId);
    if (!college) {
      return ctx.reply(ERRORS.notFound);
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
      const buttons = [
        [Markup.button.callback(NAV.backTo('Colleges'), 'browse_colleges')],
        [Markup.button.callback(NAV.home, 'go_home')]
      ];
      
      return safeEditMessage(ctx,
        `${EMOJI.college} *${college.name}*\n\n${EMPTY.departments}`,
        { parse_mode: 'Markdown', ...Markup.inlineKeyboard(buttons) }
      );
    }
    
    // Build inline keyboard with department buttons
    const buttons = departments.map(dept => [
      Markup.button.callback(
        `${EMOJI.department} ${dept.name}`,
        `department_${dept._id}`
      )
    ]);
    
    // Add back navigation
    buttons.push([Markup.button.callback(NAV.backTo('Colleges'), 'browse_colleges')]);
    buttons.push([
      Markup.button.callback(NAV.home, 'go_home'),
      Markup.button.callback(NAV.search, 'go_search')
    ]);
    
    // Edit message with departments
    await safeEditMessage(ctx, HEADERS.selectDepartment(college.name), {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard(buttons)
    });
    
    console.log(`👤 User selected college: ${college.name}`);
    
  } catch (error) {
    console.error('❌ Department handler error:', error.message);
    await ctx.reply(ERRORS.general);
  }
}

module.exports = { handleCollegeSelect };
