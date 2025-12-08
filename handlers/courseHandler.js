/**
 * ================================
 * Course Handler
 * ================================
 * 
 * Triggered when user selects a semester.
 * Fetches and displays courses based on:
 * - departmentId
 * - year
 * - semester
 */

const { Markup } = require('telegraf');
const Course = require('../db/schemas/Course');
const { updateSession, getSession, getNavigationPath } = require('../utils/sessionManager');

/**
 * Handle semester selection - Show courses
 * @param {Object} ctx - Telegraf context
 */
async function handleSemesterSelect(ctx) {
  try {
    // Acknowledge callback query
    await ctx.answerCbQuery();
    
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
        [Markup.button.callback('⬅️ Back to Semesters', `year_${session.year}`)]
      ];
      
      return ctx.editMessageText(
        `📘 *Semester ${semester}*\n` +
        `📍 ${navPath}\n\n` +
        '📭 No courses found for this semester.\n' +
        'Please try a different selection.',
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard(buttons)
        }
      );
    }
    
    // Build inline keyboard with course buttons
    const buttons = courses.map(course => [
      Markup.button.callback(
        `📖 ${course.courseCode} – ${course.name}`,
        `course_${course._id}`
      )
    ]);
    
    // Add back button
    buttons.push([Markup.button.callback('⬅️ Back to Semesters', `year_${session.year}`)]);
    
    // Edit message with courses
    await ctx.editMessageText(
      `📘 *Semester ${semester}*\n` +
      `📍 ${navPath}\n\n` +
      `Found ${courses.length} course(s):\n` +
      'Select a course to view chapters:',
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard(buttons)
      }
    );
    
    console.log(`👤 User viewing courses: ${session.departmentName} Y${session.year} S${semester}`);
    
  } catch (error) {
    console.error('❌ Course handler error:', error.message);
    await ctx.answerCbQuery('An error occurred');
    await ctx.reply('❌ An error occurred. Please try /browse again.');
  }
}

module.exports = { handleSemesterSelect };
