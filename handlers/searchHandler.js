/**
 * ================================
 * Search Handler (Day 11 Enhanced)
 * ================================
 * 
 * Global search with polished UI and loading states.
 */

const { Markup } = require('telegraf');
const Course = require('../db/schemas/Course');
const Resource = require('../db/schemas/Resource');
const { updateSearchSession, getSearchSession, updateSession } = require('../utils/sessionManager');
const {
  EMOJI,
  EMPTY,
  ERRORS,
  NAV,
  LOADING,
  getTypeIcon,
  showTyping,
  safeEditMessage,
  safeAnswerCallback
} = require('../utils/branding');

const RESULTS_PER_PAGE = 5;
const MIN_SEARCH_LENGTH = 3;
const MAX_RESULTS = 200;

/**
 * Handle /search command
 */
async function handleSearch(ctx) {
  try {
    const text = ctx.message.text;
    const keyword = text.replace(/^\/search\s*/i, '').trim();
    
    if (!keyword || keyword.length < MIN_SEARCH_LENGTH) {
      return ctx.reply(
        `${EMOJI.search} *Search Resources*\n\n` +
        `Enter at least ${MIN_SEARCH_LENGTH} characters to search.\n\n` +
        `*Usage:* \`/search calculus\`\n` +
        `*Examples:*\n` +
        `${EMOJI.bullet} \`/search biology\`\n` +
        `${EMOJI.bullet} \`/search chapter 1\`\n` +
        `${EMOJI.bullet} \`/search exam\``,
        { parse_mode: 'Markdown' }
      );
    }
    
    // Show typing indicator
    await showTyping(ctx);
    
    await performSearch(ctx, keyword, 0, 'all');
    
  } catch (error) {
    console.error('❌ Search error:', error.message);
    await ctx.reply(ERRORS.general);
  }
}

/**
 * Perform the actual search
 */
async function performSearch(ctx, keyword, page = 0, filter = 'all') {
  try {
    const regex = new RegExp(keyword, 'i');
    
    updateSearchSession(ctx.chat.id, { keyword, page, filter });
    
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
    
    // Search Resources
    if (filter === 'all' || filter === 'chapters' || filter === 'resources') {
      const resourceResults = await Resource.find({
        $or: [
          { title: regex },
          { chapter: regex }
        ]
      }).limit(MAX_RESULTS).populate('courseId');
      
      const chapterSet = new Set();
      
      resourceResults.forEach(r => {
        if (filter === 'all' || filter === 'resources') {
          resources.push(r);
        }
        
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
    
    const totalResults = courses.length + chapters.length + resources.length;
    
    if (totalResults === 0) {
      const buttons = [
        [Markup.button.callback(`${EMOJI.college} Browse Instead`, 'browse_colleges')],
        [Markup.button.callback(NAV.home, 'go_home')]
      ];
      
      const message = `${EMOJI.search} *Search Results*\n\n` +
        `${EMPTY.search}\n\n` +
        `_Searched for: "${keyword}"_`;
      
      if (ctx.callbackQuery) {
        return safeEditMessage(ctx, message, {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard(buttons)
        });
      }
      return ctx.reply(message, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard(buttons)
      });
    }
    
    // Build response
    let message = `${EMOJI.search} *Search results for:* "${keyword}"\n`;
    message += `${EMOJI.stats} Found: ${courses.length} courses, ${chapters.length} chapters, ${resources.length} resources\n\n`;
    
    const buttons = [];
    
    // Filter buttons
    buttons.push([
      Markup.button.callback(
        filter === 'all' ? `${EMOJI.success} All` : '📋 All',
        `search_filter_all_${encodeURIComponent(keyword)}`
      ),
      Markup.button.callback(
        filter === 'courses' ? `${EMOJI.success} Courses` : `${EMOJI.course} Courses`,
        `search_filter_courses_${encodeURIComponent(keyword)}`
      ),
      Markup.button.callback(
        filter === 'resources' ? `${EMOJI.success} Files` : `${EMOJI.resource} Files`,
        `search_filter_resources_${encodeURIComponent(keyword)}`
      )
    ]);
    
    // Build all items
    const allItems = [];
    
    courses.forEach(c => {
      allItems.push({
        type: 'course',
        label: `${EMOJI.course} ${c.courseCode} – ${c.name}`,
        callback: `course_${c._id}`,
        dept: c.departmentId?.name || 'Unknown'
      });
    });
    
    chapters.forEach(ch => {
      allItems.push({
        type: 'chapter',
        label: `${EMOJI.chapter} ${ch.chapter}`,
        callback: `chapter_${encodeURIComponent(ch.chapter)}_${ch.courseId}`,
        course: ch.course?.courseCode || 'Unknown'
      });
    });
    
    resources.forEach(r => {
      allItems.push({
        type: 'resource',
        label: `${getTypeIcon(r.type)} ${r.title}`,
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
    
    // Pagination buttons
    const paginationRow = [];
    if (page > 0) {
      paginationRow.push(
        Markup.button.callback('◀️ Previous', `search_page_${page - 1}_${filter}_${encodeURIComponent(keyword)}`)
      );
    }
    if (endIdx < allItems.length) {
      paginationRow.push(
        Markup.button.callback('Next ▶️', `search_page_${page + 1}_${filter}_${encodeURIComponent(keyword)}`)
      );
    }
    if (paginationRow.length > 0) {
      buttons.push(paginationRow);
    }
    
    // Navigation
    buttons.push([
      Markup.button.callback(NAV.home, 'go_home'),
      Markup.button.callback(NAV.favorites, 'go_favorites')
    ]);
    
    message += `📄 Page ${page + 1} of ${totalPages}`;
    
    if (ctx.callbackQuery) {
      await safeEditMessage(ctx, message, {
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
 */
async function handleSearchPagination(ctx) {
  try {
    await safeAnswerCallback(ctx, EMOJI.loading);
    await showTyping(ctx);
    
    const data = ctx.callbackQuery.data;
    const parts = data.split('_');
    const page = parseInt(parts[2]);
    const filter = parts[3];
    const keyword = decodeURIComponent(parts.slice(4).join('_'));
    
    await performSearch(ctx, keyword, page, filter);
    
  } catch (error) {
    console.error('❌ Pagination error:', error.message);
    await ctx.answerCbQuery(ERRORS.general);
  }
}

/**
 * Handle search filter change
 */
async function handleSearchFilter(ctx) {
  try {
    await safeAnswerCallback(ctx, EMOJI.loading);
    await showTyping(ctx);
    
    const data = ctx.callbackQuery.data;
    const parts = data.split('_');
    const filter = parts[2];
    const keyword = decodeURIComponent(parts.slice(3).join('_'));
    
    await performSearch(ctx, keyword, 0, filter);
    
  } catch (error) {
    console.error('❌ Filter error:', error.message);
    await ctx.answerCbQuery(ERRORS.general);
  }
}

/**
 * Handle chapter selection from search results
 */
async function handleSearchChapterSelect(ctx) {
  try {
    await safeAnswerCallback(ctx, EMOJI.loading);
    await showTyping(ctx);
    
    const data = ctx.callbackQuery.data;
    const parts = data.replace('chapter_', '').split('_');
    const courseId = parts.pop();
    const chapter = decodeURIComponent(parts.join('_'));
    
    const Course = require('../db/schemas/Course');
    
    const course = await Course.findById(courseId);
    if (!course) {
      return ctx.reply(ERRORS.notFound);
    }
    
    updateSession(ctx.chat.id, {
      courseId: course._id,
      courseCode: course.courseCode,
      courseName: course.name,
      chapter: chapter
    });
    
    const resources = await Resource.find({
      courseId: courseId,
      chapter: chapter
    });
    
    if (!resources || resources.length === 0) {
      const buttons = [
        [Markup.button.callback(`${EMOJI.back} Back to Search`, 'back_search')],
        [Markup.button.callback(NAV.home, 'go_home')]
      ];
      
      return safeEditMessage(ctx,
        `${EMOJI.chapter} *${chapter}*\n` +
        `${EMOJI.course} ${course.courseCode} – ${course.name}\n\n` +
        `${EMPTY.resources}`,
        { parse_mode: 'Markdown', ...Markup.inlineKeyboard(buttons) }
      );
    }
    
    const buttons = resources.map(r => [
      Markup.button.callback(
        `${getTypeIcon(r.type)} ${r.title}`,
        `resource_${r._id}`
      )
    ]);
    
    buttons.push([Markup.button.callback(`${EMOJI.back} Back to Search`, 'back_search')]);
    buttons.push([Markup.button.callback(NAV.home, 'go_home')]);
    
    await safeEditMessage(ctx,
      `${EMOJI.chapter} *${chapter}*\n` +
      `${EMOJI.course} ${course.courseCode} – ${course.name}\n\n` +
      `${EMOJI.resource} Found ${resources.length} resource(s):`,
      { parse_mode: 'Markdown', ...Markup.inlineKeyboard(buttons) }
    );
    
  } catch (error) {
    console.error('❌ Search chapter error:', error.message);
    await ctx.reply(ERRORS.general);
  }
}

/**
 * Handle back to search
 */
async function handleBackToSearch(ctx) {
  try {
    await safeAnswerCallback(ctx);
    
    const session = getSearchSession(ctx.chat.id);
    if (session && session.keyword) {
      await performSearch(ctx, session.keyword, session.page || 0, session.filter || 'all');
    } else {
      await safeEditMessage(ctx,
        `${EMOJI.search} *Search Resources*\n\n` +
        `Use \`/search <keyword>\` to search.\n\n` +
        `*Example:* \`/search biology\``,
        { parse_mode: 'Markdown' }
      );
    }
    
  } catch (error) {
    console.error('❌ Back to search error:', error.message);
  }
}

/**
 * Handle text messages (suggest search)
 */
async function handleTextMessage(ctx) {
  const text = ctx.message.text;
  
  if (text.startsWith('/')) return;
  if (text.length < 3) return;
  
  await ctx.reply(
    `${EMOJI.info} Did you mean to search?\n\n` +
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
