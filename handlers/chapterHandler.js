/**
 * ================================
 * Chapter Handler (Day 11 Enhanced)
 * ================================
 * 
 * Shows chapters when user selects a course.
 * Dynamic chapter loading with improved navigation.
 */

const { Markup } = require('telegraf');
const Course = require('../db/schemas/Course');
const Resource = require('../db/schemas/Resource');
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
 * Handle course selection - Show chapters
 */
async function handleCourseSelect(ctx) {
  try {
    await safeAnswerCallback(ctx, EMOJI.loading);
    
    // Show typing indicator
    await showTyping(ctx);
    
    // Extract course ID from callback data
    const courseId = ctx.callbackQuery.data.replace('course_', '');
    
    // Fetch course details with department info
    const course = await Course.findById(courseId).populate('departmentId');
    if (!course) {
      return ctx.reply(ERRORS.notFound);
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
      const numA = parseInt(a.match(/\d+/)?.[0] || '0');
      const numB = parseInt(b.match(/\d+/)?.[0] || '0');
      if (numA !== numB) return numA - numB;
      return a.localeCompare(b);
    });
    
    // Check if chapters exist
    if (chapters.length === 0) {
      const buttons = [
        [Markup.button.callback(`${EMOJI.notify} Notify me when available`, `notify_interest_course_${course._id}`)],
        [Markup.button.callback(NAV.backTo('Courses'), `semester_${session.semester}`)],
        [Markup.button.callback(NAV.backTo('Semesters'), `year_${session.year}`)],
        [Markup.button.callback(NAV.home, 'go_home')]
      ];
      
      return safeEditMessage(ctx,
        `${EMOJI.course} *${course.courseCode} – ${course.name}*\n\n` +
        `${formatBreadcrumb(navPath)}\n\n` +
        `${course.description ? `_${course.description}_\n\n` : ''}` +
        `${EMPTY.chapters}`,
        { parse_mode: 'Markdown', ...Markup.inlineKeyboard(buttons) }
      );
    }
    
    // Build chapter buttons
    const buttons = chapters.map(chapter => [
      Markup.button.callback(
        `${EMOJI.chapter} ${chapter}`,
        `chapter_${encodeURIComponent(chapter)}`
      )
    ]);
    
    // Add navigation buttons
    buttons.push([Markup.button.callback(NAV.backTo('Courses'), `semester_${session.semester}`)]);
    buttons.push([
      Markup.button.callback(NAV.home, 'go_home'),
      Markup.button.callback(NAV.search, 'go_search')
    ]);
    
    const message = `${HEADERS.selectChapter(course.courseCode, course.name, chapters.length)}\n\n` +
      `${formatBreadcrumb(navPath)}\n\n` +
      `${course.description ? `_${course.description}_\n\n` : ''}` +
      `Select a chapter:`;
    
    // Edit message with chapters
    await safeEditMessage(ctx, message, {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard(buttons)
    });
    
    console.log(`👤 User viewing chapters for: ${course.courseCode} (${chapters.length} chapters)`);
    
  } catch (error) {
    console.error('❌ Chapter handler error:', error.message);
    await ctx.reply(ERRORS.general);
  }
}

module.exports = { handleCourseSelect };
