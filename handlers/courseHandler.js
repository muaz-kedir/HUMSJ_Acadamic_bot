/**
 * ================================
 * Course Handler (Day 11 Enhanced)
 * ================================
 * 
 * Shows courses when user selects a semester.
 * Includes loading states and improved navigation.
 */

const { Markup } = require('telegraf');
const Course = require('../db/schemas/Course');
const { updateSession, getSession, getNavigationPath } = require('../utils/sessionManager');
const {
  EMOJI,
  HEADERS,
  EMPTY,
  ERRORS,
  NAV,
  formatBreadcrumb,
  showTyping,
  safeEditMessage,
  safeAnswerCallback
} = require('../utils/branding');

/**
 * Handle semester selection - Show courses
 */
async function handleSemesterSelect(ctx) {
  try {
    await safeAnswerCallback(ctx, EMOJI.loading);
    
    // Show typing indicator
    await showTyping(ctx);
    
    // Extract semester from callback data
    const semester = parseInt(ctx.callbackQuery.data.replace('semester_', ''));
    
    // Update session
    updateSession(ctx.chat.id, { semester: semester });
    
    // Get session data
    const session = getSession(ctx.chat.id);
    const navPath = getNavigationPath(ctx.chat.id);
    
    // Fetch courses matching criteria
    const courses = await Course.find({
      departmentId: session.departmentId,
      year: session.year,
      semester: semester
    }).sort({ courseCode: 1 });
    
    // Check if courses exist
    if (!courses || courses.length === 0) {
      const buttons = [
        [Markup.button.callback(NAV.backTo('Semesters'), `year_${session.year}`)],
        [Markup.button.callback(NAV.backTo('Years'), `department_${session.departmentId}`)],
        [Markup.button.callback(NAV.home, 'go_home')]
      ];
      
      return safeEditMessage(ctx,
        `${EMOJI.semester} *Semester ${semester}*\n\n` +
        `${formatBreadcrumb(navPath)}\n\n` +
        `${EMPTY.courses}`,
        { parse_mode: 'Markdown', ...Markup.inlineKeyboard(buttons) }
      );
    }
    
    // Build inline keyboard with course buttons
    const buttons = courses.map(course => [
      Markup.button.callback(
        `${EMOJI.course} ${course.courseCode} – ${course.name}`,
        `course_${course._id}`
      )
    ]);
    
    // Add back navigation
    buttons.push([Markup.button.callback(NAV.backTo('Semesters'), `year_${session.year}`)]);
    buttons.push([
      Markup.button.callback(NAV.home, 'go_home'),
      Markup.button.callback(NAV.search, 'go_search')
    ]);
    
    const message = `${HEADERS.selectCourse(semester, courses.length)}\n\n${formatBreadcrumb(navPath)}\n\nSelect a course to view chapters:`;
    
    // Edit message with courses
    await safeEditMessage(ctx, message, {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard(buttons)
    });
    
    console.log(`👤 User viewing courses: ${session.departmentName} Y${session.year} S${semester}`);
    
  } catch (error) {
    console.error('❌ Course handler error:', error.message);
    await ctx.reply(ERRORS.general);
  }
}

module.exports = { handleSemesterSelect };
