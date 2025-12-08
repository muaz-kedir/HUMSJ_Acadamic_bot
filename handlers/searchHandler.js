/**
 * ================================
 * Search Handler
 * ================================
 * 
 * Global search system that bypasses navigation.
 * Searches across courses, chapters (via resources), and resources.
 * Supports pagination and filtering.
 */

const { Markup } = require('telegraf');
const Course = require('../db/schemas/Course');
const Resource = require('../db/schemas/Resource');
const { updateSearchSession, getSearchSession } = require('../utils/sessionManager');

// Constants
const RESULTS_PER_PAGE = 5;
const MIN_SEARCH_LENGTH = 3;
const MAX_RESULTS = 200;

/**
 * Handle /search command
 * @param {Object} ctx - Telegraf context
 */
async function handleSearch(ctx) {
  try {
    // Extract search keyword from command
    const text = ctx.message.text;
    const keyword = text.replace(/^\/search\s*/i, '').trim();
    
    // Validate keyword length
    if (!keyword || keyword.length < MIN_SEARCH_LENGTH) {
      return ctx.reply(
        '🔍 *Global Search*\n\n' +
        'Enter at least 3 characters to search.\n\n' +
        '*Usage:* `/search calculus`\n' +
        '*Example:* `/search biology`',
        { parse_mode: 'Markdown' }
      );
    }
    
    // Perform search
    await performSearch(ctx, keyword, 0, 'all');
    
  } catch (error) {
    console.error('❌ Search error:', error.message);
    await ctx.reply('❌ Search failed. Please try again later.');
  }
}

/**
 * Perform the actual search
 * @param {Object} ctx - Telegraf context
 * @param {string} keyword - Search term
 * @param {number} page - Current page (0-indexed)
 * @param {string} filter - Filter type: 'all', 'courses', 'chapters', 'resources'
 */
async function performSearch(ctx, keyword, page = 0, filter = 'all') {
  try {
    // Create case-insensitive regex
    const regex = new RegExp(keyword, 'i');
    
    // Store search in session
    updateSearchSession(ctx.chat.id, { keyword, page, filter });
    
    // Search results containers
    let courses = [];
    let chapters = [];
    let resources = [];
    
    // Search Courses
    if (filter === 'all' || filter === 'courses') {
      courses = await Course.find({
        $or: [
          { name: regex },
          { description: regex },
          { courseCode: regex }
        ]
      }).limit(MAX_RESULTS).populate('departmentId');
    }
    
    // Search Resources (for chapters and files)
    if (filter === 'all' || filter === 'chapters' || filter === 'resources') {
      const resourceResults = await Resource.find({
        $or: [
          { title: regex },
          { chapter: regex }
        ]
      }).limit(MAX_RESULTS).populate('courseId');
      
      // Separate chapters and resources
      const chapterSet = new Set();
      
      resourceResults.forEach(r => {
        // Add to resources
        if (filter === 'all' || filter === 'resources') {
          resources.push(r);
        }
        
        // Extract unique chapters
        if ((filter === 'all' || filter === 'chapters') && r.chapter) {
          const chapterKey = `${r.courseId?._id}_${r.chapter}`;
          if (!chapterSet.has(chapterKey)) {
            chapterSet.add(chapterKey);
            chapters.push({
              chapter: r.chapter,
              course: r.courseId,
              courseId: r.courseId?._id
            });
          }
        }
      });
    }
    
    // Check total results
    const totalResults = courses.length + chapters.length + resources.length;
    
    if (totalResults === 0) {
      return ctx.reply(
        `🔍 *Search Results*\n\n` +
        `No results found for "${keyword}".\n\n` +
        'Try more general keywords or check spelling.',
        { parse_mode: 'Markdown' }
      );
    }
    
    if (totalResults > MAX_RESULTS) {
      return ctx.reply(
        `🔍 *Search Results*\n\n` +
        `Too many results (${totalResults}+). Please refine your search term.`,
        { parse_mode: 'Markdown' }
      );
    }
    
    // Build response message
    let message = `🔍 *Search results for:* "${keyword}"\n`;
    message += `📊 Found: ${courses.length} courses, ${chapters.length} chapters, ${resources.length} resources\n\n`;
    
    // Build buttons array
    const buttons = [];
    
    // Add filter buttons
    buttons.push([
      Markup.button.callback(
        filter === 'all' ? '✅ All' : '📋 All',
        `search_filter_all_${encodeURIComponent(keyword)}`
      ),
      Markup.button.callback(
        filter === 'courses' ? '✅ Courses' : '📘 Courses',
        `search_filter_courses_${encodeURIComponent(keyword)}`
      ),
      Markup.button.callback(
        filter === 'resources' ? '✅ Resources' : '📄 Resources',
        `search_filter_resources_${encodeURIComponent(keyword)}`
      )
    ]);
    
    // Calculate pagination
    const allItems = [];
    
    // Add courses to items
    courses.forEach(c => {
      allItems.push({
        type: 'course',
        label: `📘 ${c.courseCode} – ${c.name}`,
        callback: `course_${c._id}`,
        dept: c.departmentId?.name || 'Unknown'
      });
    });
    
    // Add chapters to items
    chapters.forEach(ch => {
      allItems.push({
        type: 'chapter',
        label: `📑 ${ch.chapter}`,
        callback: `chapter_${encodeURIComponent(ch.chapter)}_${ch.courseId}`,
        course: ch.course?.courseCode || 'Unknown'
      });
    });
    
    // Add resources to items
    resources.forEach(r => {
      const typeIcons = { pdf: '📄', slide: '📊', book: '📖', exam: '📝' };
      allItems.push({
        type: 'resource',
        label: `${typeIcons[r.type] || '📁'} ${r.title}`,
        callback: `resource_${r._id}`,
        chapter: r.chapter
      });
    });
    
    // Paginate
    const startIdx = page * RESULTS_PER_PAGE;
    const endIdx = startIdx + RESULTS_PER_PAGE;
    const pageItems = allItems.slice(startIdx, endIdx);
    const totalPages = Math.ceil(allItems.length / RESULTS_PER_PAGE);
    
    // Add result buttons
    pageItems.forEach(item => {
      let sublabel = '';
      if (item.type === 'course') sublabel = `(${item.dept})`;
      if (item.type === 'chapter') sublabel = `(${item.course})`;
      if (item.type === 'resource') sublabel = `(${item.chapter})`;
      
      buttons.push([
        Markup.button.callback(
          `${item.label} ${sublabel}`.substring(0, 60),
          item.callback
        )
      ]);
    });
    
    // Add pagination buttons
    const paginationRow = [];
    if (page > 0) {
      paginationRow.push(
        Markup.button.callback('⬅️ Previous', `search_page_${page - 1}_${filter}_${encodeURIComponent(keyword)}`)
      );
    }
    if (endIdx < allItems.length) {
      paginationRow.push(
        Markup.button.callback('Next ➡️', `search_page_${page + 1}_${filter}_${encodeURIComponent(keyword)}`)
      );
    }
    if (paginationRow.length > 0) {
      buttons.push(paginationRow);
    }
    
    // Add page indicator
    message += `📄 Page ${page + 1} of ${totalPages}`;
    
    // Send or edit message
    if (ctx.callbackQuery) {
      await ctx.editMessageText(message, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard(buttons)
      });
    } else {
      await ctx.reply(message, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard(buttons)
      });
    }
    
    console.log(`🔍 Search: "${keyword}" by ${ctx.from?.username || ctx.from?.id} - ${totalResults} results`);
    
  } catch (error) {
    console.error('❌ Search perform error:', error.message);
    throw error;
  }
}

/**
 * Handle search pagination
 * @param {Object} ctx - Telegraf context
 */
async function handleSearchPagination(ctx) {
  try {
    await ctx.answerCbQuery();
    
    // Parse callback data: search_page_<page>_<filter>_<keyword>
    const data = ctx.callbackQuery.data;
    const parts = data.split('_');
    const page = parseInt(parts[2]);
    const filter = parts[3];
    const keyword = decodeURIComponent(parts.slice(4).join('_'));
    
    await performSearch(ctx, keyword, page, filter);
    
  } catch (error) {
    console.error('❌ Pagination error:', error.message);
    await ctx.answerCbQuery('An error occurred');
  }
}

/**
 * Handle search filter change
 * @param {Object} ctx - Telegraf context
 */
async function handleSearchFilter(ctx) {
  try {
    await ctx.answerCbQuery();
    
    // Parse callback data: search_filter_<filter>_<keyword>
    const data = ctx.callbackQuery.data;
    const parts = data.split('_');
    const filter = parts[2];
    const keyword = decodeURIComponent(parts.slice(3).join('_'));
    
    await performSearch(ctx, keyword, 0, filter);
    
  } catch (error) {
    console.error('❌ Filter error:', error.message);
    await ctx.answerCbQuery('An error occurred');
  }
}

/**
 * Handle chapter selection from search results
 * Needs special handling because we have courseId in callback
 * @param {Object} ctx - Telegraf context
 */
async function handleSearchChapterSelect(ctx) {
  try {
    await ctx.answerCbQuery();
    
    // Parse: chapter_<encodedChapter>_<courseId>
    const data = ctx.callbackQuery.data;
    const parts = data.replace('chapter_', '').split('_');
    const courseId = parts.pop();
    const chapter = decodeURIComponent(parts.join('_'));
    
    // Import resource handler dynamically to avoid circular deps
    const { updateSession } = require('../utils/sessionManager');
    const Resource = require('../db/schemas/Resource');
    const Course = require('../db/schemas/Course');
    
    // Get course info
    const course = await Course.findById(courseId);
    if (!course) {
      return ctx.reply('❌ Course not found.');
    }
    
    // Update session
    updateSession(ctx.chat.id, {
      courseId: course._id,
      courseCode: course.courseCode,
      courseName: course.name,
      chapter: chapter
    });
    
    // Fetch resources for this chapter
    const resources = await Resource.find({
      courseId: courseId,
      chapter: chapter
    });
    
    if (!resources || resources.length === 0) {
      return ctx.editMessageText(
        `📑 *${chapter}*\n` +
        `📖 ${course.courseCode} – ${course.name}\n\n` +
        '📭 No resources found for this chapter.',
        { parse_mode: 'Markdown' }
      );
    }
    
    // Build resource buttons
    const typeIcons = { pdf: '📄', slide: '📊', book: '📖', exam: '📝' };
    const buttons = resources.map(r => [
      Markup.button.callback(
        `${typeIcons[r.type] || '📁'} ${r.title}`,
        `resource_${r._id}`
      )
    ]);
    
    buttons.push([Markup.button.callback('🔍 Back to Search', 'back_search')]);
    
    await ctx.editMessageText(
      `📑 *${chapter}*\n` +
      `📖 ${course.courseCode} – ${course.name}\n\n` +
      `Found ${resources.length} resource(s):`,
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard(buttons)
      }
    );
    
  } catch (error) {
    console.error('❌ Search chapter error:', error.message);
    await ctx.reply('❌ An error occurred.');
  }
}

/**
 * Handle back to search
 * @param {Object} ctx - Telegraf context
 */
async function handleBackToSearch(ctx) {
  try {
    await ctx.answerCbQuery();
    
    const session = getSearchSession(ctx.chat.id);
    if (session && session.keyword) {
      await performSearch(ctx, session.keyword, session.page || 0, session.filter || 'all');
    } else {
      await ctx.editMessageText(
        '🔍 *Global Search*\n\n' +
        'Use `/search <keyword>` to search.\n\n' +
        '*Example:* `/search biology`',
        { parse_mode: 'Markdown' }
      );
    }
    
  } catch (error) {
    console.error('❌ Back to search error:', error.message);
  }
}

/**
 * Handle text messages (suggest search)
 * @param {Object} ctx - Telegraf context
 */
async function handleTextMessage(ctx) {
  const text = ctx.message.text;
  
  // Ignore if it's a command
  if (text.startsWith('/')) return;
  
  // Ignore very short messages
  if (text.length < 3) return;
  
  // Suggest search
  await ctx.reply(
    `💡 Did you mean to search?\n\n` +
    `Type: \`/search ${text}\``,
    { parse_mode: 'Markdown' }
  );
}

module.exports = {
  handleSearch,
  handleSearchPagination,
  handleSearchFilter,
  handleSearchChapterSelect,
  handleBackToSearch,
  handleTextMessage
};
