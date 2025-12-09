/**
 * ================================
 * Chapter Handler (Day 7 Enhanced)
 * ================================
 * 
 * Triggered when user selects a course.
 * Shows available chapters dynamically from database.
 * Includes improved navigation buttons.
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
    await ctx.answerCbQuery();
    
    // Extract course ID from callback data
    const courseId = ctx.callbackQuery.data.replace('course_', '');
    
    // Fetch course details with department info
    const course = await Course.findById(courseId).populate('departmentId');
    if (!course) {
      return ctx.reply('❌ Course not found. Please try again.');
    }
    
    // Update session with course info
    updateSession(ctx.chat.id, {
      courseId: course._id,
      courseCode: course.courseCode,
      courseName: course.name,
      chapter: null
    });
    
    // Get navigation path
    const navPath = getNavigationPath(ctx.chat.id);
    const session = getSession(ctx.chat.id);
    
    // Fetch unique chapters for this course (dynamically from resources)
    const resources = await Resource.find({ courseId: course._id });
    
    // Extract unique chapters and sort them
    const chaptersSet = new Set();
    resources.forEach(r => {
      if (r.chapter && r.chapter.trim()) {
        chaptersSet.add(r.chapter);
      }
    });
    
    // Sort chapters naturally (Chapter 1, Chapter 2, etc.)
    const chapters = Array.from(chaptersSet).sort((a, b) => {
      // Extract numbers for natural sorting
      const numA = parseInt(a.match(/\d+/)?.[0] || '0');
      const numB = parseInt(b.match(/\d+/)?.[0] || '0');
      if (numA !== numB) return numA - numB;
      return a.localeCompare(b);
    });
    
    // Check if chapters exist
    if (chapters.length === 0) {
      const buttons = [
        [Markup.button.callback('⬅️ Back to Courses', `semester_${session.semester}`)],
        [Markup.button.callback('⬅️ Back to Semesters', `year_${session.year}`)]
      ];
      
      return ctx.editMessageText(
        `📖 *${course.courseCode} – ${course.name}*\n` +
        `📍 ${navPath}\n\n` +
        `${course.description || ''}\n\n` +
        '📭 No chapters are available for this course yet.\n' +
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
    
    // Add navigation buttons
    buttons.push([
      Markup.button.callback('⬅️ Back to Courses', `semester_${session.semester}`)
    ]);
    buttons.push([
      Markup.button.callback('⬅️ Back to Semesters', `year_${session.year}`)
    ]);
    
    // Edit message with chapters
    await ctx.editMessageText(
      `📖 *${course.courseCode} – ${course.name}*\n` +
      `📍 ${navPath}\n\n` +
      `${course.description ? course.description + '\n\n' : ''}` +
      `📚 Choose a chapter:\n` +
      `Found ${chapters.length} chapter(s) available:`,
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard(buttons)
      }
    );
    
    console.log(`👤 User viewing chapters for: ${course.courseCode} (${chapters.length} chapters)`);
    
  } catch (error) {
    console.error('❌ Chapter handler error:', error.message);
    await ctx.answerCbQuery('⚠️ Something went wrong');
    await ctx.reply('⚠️ Something went wrong. Please try again later.');
  }
}

module.exports = { handleCourseSelect };
