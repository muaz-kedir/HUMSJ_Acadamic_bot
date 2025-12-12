/**
 * ================================
 * Resource Handler (Day 11 Enhanced)
 * ================================
 * 
 * Handles chapter selection and resource delivery.
 * Polished UI with loading states and improved navigation.
 */

const { Markup } = require('telegraf');
const path = require('path');
const fs = require('fs');
const Resource = require('../db/schemas/Resource');
const { updateSession, getSession, getNavigationPath } = require('../utils/sessionManager');
const { recordHistory } = require('./historyHandler');
const {
  EMOJI,
  HEADERS,
  EMPTY,
  ERRORS,
  SUCCESS,
  NAV,
  formatBreadcrumb,
  getTypeIcon,
  showTyping,
  safeEditMessage,
  safeAnswerCallback
} = require('../utils/branding');

/**
 * Handle chapter selection - Show resources
 */
async function handleChapterSelect(ctx) {
  try {
    await safeAnswerCallback(ctx, EMOJI.loading);
    
    // Show typing indicator
    await showTyping(ctx);
    
    // Extract chapter from callback data
    const chapter = decodeURIComponent(ctx.callbackQuery.data.replace('chapter_', ''));
    
    // Get session
    const session = getSession(ctx.chat.id);
    
    if (!session.courseId) {
      return ctx.reply(ERRORS.sessionExpired);
    }
    
    // Update session with chapter
    updateSession(ctx.chat.id, { chapter: chapter });
    
    // Get navigation path
    const navPath = getNavigationPath(ctx.chat.id);
    
    // Fetch resources for this course and chapter
    const resources = await Resource.find({
      courseId: session.courseId,
      chapter: chapter
    }).sort({ type: 1, title: 1 });
    
    // Check if resources exist
    if (!resources || resources.length === 0) {
      const buttons = [
        [Markup.button.callback(`${EMOJI.notify} Notify me when available`, `notify_interest_chapter_${encodeURIComponent(chapter)}`)],
        [Markup.button.callback(NAV.backTo('Chapters'), `course_${session.courseId}`)],
        [Markup.button.callback(NAV.backTo('Courses'), `semester_${session.semester}`)],
        [Markup.button.callback(NAV.home, 'go_home')]
      ];
      
      return safeEditMessage(ctx,
        `${EMOJI.chapter} *${chapter}*\n\n` +
        `${formatBreadcrumb(navPath)}\n\n` +
        `${EMPTY.resources}`,
        { parse_mode: 'Markdown', ...Markup.inlineKeyboard(buttons) }
      );
    }
    
    // Build resource buttons
    const buttons = resources.map(resource => [
      Markup.button.callback(
        `${getTypeIcon(resource.type)} ${resource.title}`,
        `resource_${resource._id}`
      )
    ]);
    
    // Add navigation buttons
    buttons.push([Markup.button.callback(NAV.backTo('Chapters'), `course_${session.courseId}`)]);
    buttons.push([
      Markup.button.callback(NAV.home, 'go_home'),
      Markup.button.callback(NAV.favorites, 'go_favorites')
    ]);
    
    const message = `${HEADERS.selectResource(chapter, resources.length)}\n\n` +
      `${EMOJI.course} Course: ${session.courseCode} – ${session.courseName}\n` +
      `${formatBreadcrumb(navPath)}\n\n` +
      `Select a file to download:`;
    
    // Edit message with resources
    await safeEditMessage(ctx, message, {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard(buttons)
    });
    
    console.log(`👤 User viewing resources for: ${chapter}`);
    
  } catch (error) {
    console.error('❌ Resource list error:', error.message);
    await ctx.reply(ERRORS.general);
  }
}

/**
 * Handle resource selection - Deliver file
 */
async function handleResourceSelect(ctx) {
  try {
    await safeAnswerCallback(ctx, SUCCESS.downloadStarted);
    
    // Show typing indicator
    await showTyping(ctx);
    
    // Extract resource ID
    const resourceId = ctx.callbackQuery.data.replace('resource_', '');
    
    // Fetch resource details with course info
    const resource = await Resource.findById(resourceId).populate('courseId');
    if (!resource) {
      return ctx.reply(ERRORS.notFound);
    }
    
    // Get session for navigation
    const session = getSession(ctx.chat.id);
    const navPath = getNavigationPath(ctx.chat.id);
    
    // Get course info
    const courseName = resource.courseId?.name || session.courseName || 'Unknown Course';
    const courseCode = resource.courseId?.courseCode || session.courseCode || '';
    
    // Prepare info message
    const infoMessage = 
      `${getTypeIcon(resource.type)} *${resource.title}*\n\n` +
      `${EMOJI.course} Course: ${courseCode} – ${courseName}\n` +
      `${EMOJI.chapter} Chapter: ${resource.chapter}\n` +
      `${formatBreadcrumb(navPath)}`;
    
    // Try to send the file
    let fileSent = false;
    
    // Method 1: Check for URL-based file
    if (resource.fileUrl && resource.fileUrl.startsWith('http')) {
      try {
        await ctx.reply(`${infoMessage}\n\n${EMOJI.download} Downloading file...`, { parse_mode: 'Markdown' });
        
        await ctx.replyWithDocument(
          { url: resource.fileUrl, filename: `${resource.title}.pdf` },
          {
            caption: `${EMOJI.resource} ${resource.title}\n${EMOJI.chapter} ${resource.chapter}`,
            ...Markup.inlineKeyboard([
              [Markup.button.callback(NAV.backTo('Resources'), `chapter_${encodeURIComponent(resource.chapter)}`)],
              [
                Markup.button.callback(`${EMOJI.favorites} Add to Favorites`, `fav_add_${resource._id}`),
                Markup.button.callback(NAV.home, 'go_home')
              ]
            ])
          }
        );
        
        fileSent = true;
        
        // Increment download count and record history
        await Resource.findByIdAndUpdate(resourceId, { $inc: { downloads: 1 } });
        await recordHistory(ctx.from.id.toString(), resourceId, 'download');
        
        console.log(`📤 URL file sent: ${resource.title} to ${ctx.from.username || ctx.from.id}`);
        
      } catch (urlError) {
        console.error('❌ URL file error:', urlError.message);
      }
    }
    
    // Method 2: Check for local file
    if (!fileSent && resource.filePath) {
      const filePath = path.join(process.cwd(), resource.filePath);
      
      if (fs.existsSync(filePath)) {
        try {
          await ctx.reply(`${infoMessage}\n\n${EMOJI.download} Sending file...`, { parse_mode: 'Markdown' });
          
          await ctx.replyWithDocument(
            { source: filePath },
            {
              caption: `${EMOJI.resource} ${resource.title}\n${EMOJI.chapter} ${resource.chapter}`,
              ...Markup.inlineKeyboard([
                [Markup.button.callback(NAV.backTo('Resources'), `chapter_${encodeURIComponent(resource.chapter)}`)],
                [
                  Markup.button.callback(`${EMOJI.favorites} Add to Favorites`, `fav_add_${resource._id}`),
                  Markup.button.callback(NAV.home, 'go_home')
                ]
              ])
            }
          );
          
          fileSent = true;
          
          // Increment download count and record history
          await Resource.findByIdAndUpdate(resourceId, { $inc: { downloads: 1 } });
          await recordHistory(ctx.from.id.toString(), resourceId, 'download');
          
          console.log(`📤 Local file sent: ${resource.title} to ${ctx.from.username || ctx.from.id}`);
          
        } catch (localError) {
          console.error('❌ Local file error:', localError.message);
        }
      }
    }
    
    // If no file was sent, show error
    if (!fileSent) {
      const buttons = [
        [Markup.button.callback(`${EMOJI.notify} Notify when fixed`, `notify_interest_resource_${resourceId}`)],
        [Markup.button.callback(NAV.backTo('Resources'), `chapter_${encodeURIComponent(resource.chapter)}`)],
        [Markup.button.callback(NAV.backTo('Chapters'), `course_${session.courseId}`)],
        [Markup.button.callback(NAV.home, 'go_home')]
      ];
      
      await safeEditMessage(ctx,
        `${infoMessage}\n\n` +
        `${EMOJI.warning} *This resource is temporarily unavailable*\n\n` +
        `The library team has been notified.\n` +
        `_Please try again later or choose another resource._`,
        { parse_mode: 'Markdown', ...Markup.inlineKeyboard(buttons) }
      );
    }
    
  } catch (error) {
    console.error('❌ Resource delivery error:', error.message);
    await ctx.reply(ERRORS.general + ERRORS.tryAgain, { parse_mode: 'Markdown' });
  }
}

module.exports = { handleChapterSelect, handleResourceSelect };
