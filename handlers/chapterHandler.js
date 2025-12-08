/**
 * ================================
 * Chapter Handler
 * ================================
 * 
 * Triggered when user selects a course.
 * Shows available chapters/sections for that course.
 * Chapters are derived from Resource documents.
 */

const { Markup } = require('telegraf');
const Course = require('../db/schemas/Course');
const Resource = require('../db/schemas/Resource');
const { updateSession, getSession, getNavigationPath } = require('../utils/sessionManager');

/**
 * Handle course selection - Show chapters
 * @param {Object} ctx - Telegraf context
 */
async function handleCourseSelect(ctx) {
  try {
    // Acknowledge callback query
    await ctx.answerCbQuery();
    
    // Extract course ID from callback data
    const courseId = ctx.callbackQuery.data.replace('course_', '');
    
    // Fetch course details
    const course = await Course.findById(courseId);
    if (!course) {
      return ctx.reply('❌ Course not found. Please try again.');
    }
    
    // Update session with course info
    updateSession(ctx.chat.id, {
      courseId: course._id,
      courseCode: course.courseCode,
      courseName: course.name,
      chapterId: null
    });
    
    // Get navigation path
    const navPath = getNavigationPath(ctx.chat.id);
    
    // Fetch unique chapters for this course
    const resources = await Resource.find({ courseId: course._id });
    
    // Extract unique chapters
    const chaptersSet = new Set();
    resources.forEach(r => {
      if (r.chapter && r.chapter.trim()) {
        chaptersSet.add(r.chapter);
      }
    });
    const chapters = Array.from(chaptersSet).sort();
    
    // Check if chapters exist
    if (chapters.length === 0) {
      const session = getSession(ctx.chat.id);
      const buttons = [
        [Markup.button.callback('⬅️ Back to Courses', `semester_${session.semester}`)]
      ];
      
      return ctx.editMessageText(
        `📖 *${course.courseCode} – ${course.name}*\n` +
        `📍 ${navPath}\n\n` +
        '📭 No chapters are available for this course.\n' +
        'Please check back later.',
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard(buttons)
        }
      );
    }
    
    // Build chapter buttons
    const buttons = chapters.map(chapter => [
      Markup.button.callback(
        `📑 ${chapter}`,
        `chapter_${encodeURIComponent(chapter)}`
      )
    ]);
    
    // Add back button
    const session = getSession(ctx.chat.id);
    buttons.push([Markup.button.callback('⬅️ Back to Courses', `semester_${session.semester}`)]);
    
    // Edit message with chapters
    await ctx.editMessageText(
      `📖 *${course.courseCode} – ${course.name}*\n` +
      `📍 ${navPath}\n\n` +
      `${course.description || ''}\n\n` +
      `Found ${chapters.length} chapter(s):\n` +
      'Select a chapter to view resources:',
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard(buttons)
      }
    );
    
    console.log(`👤 User viewing chapters for: ${course.courseCode}`);
    
  } catch (error) {
    console.error('❌ Chapter handler error:', error.message);
    await ctx.answerCbQuery('An error occurred');
    await ctx.reply('❌ An error occurred. Please try /browse again.');
  }
}

module.exports = { handleCourseSelect };
