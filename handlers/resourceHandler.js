/**
 * ================================
 * Resource Handler (Day 7 Enhanced)
 * ================================
 * 
 * Handles chapter selection and resource file delivery.
 * Supports both local files and URL-based files.
 * Includes improved navigation and error handling.
 */

const { Markup } = require('telegraf');
const path = require('path');
const fs = require('fs');
const Resource = require('../db/schemas/Resource');
const { updateSession, getSession, getNavigationPath } = require('../utils/sessionManager');
const { recordHistory } = require('./historyHandler');

// Type icons for display
const TYPE_ICONS = {
  pdf: '📄',
  slide: '📊',
  book: '📖',
  exam: '📝'
};

/**
 * Handle chapter selection - Show resources
 * @param {Object} ctx - Telegraf context
 */
async function handleChapterSelect(ctx) {
  try {
    await ctx.answerCbQuery();
    
    // Extract chapter from callback data
    const chapter = decodeURIComponent(ctx.callbackQuery.data.replace('chapter_', ''));
    
    // Get session
    const session = getSession(ctx.chat.id);
    
    if (!session.courseId) {
      return ctx.reply('❌ Session expired. Please use /browse to start again.');
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
        [Markup.button.callback('🔔 Notify me when available', `notify_interest_chapter_${encodeURIComponent(chapter)}`)],
        [Markup.button.callback('⬅️ Back to Chapters', `course_${session.courseId}`)],
        [Markup.button.callback('⬅️ Back to Courses', `semester_${session.semester}`)],
        [Markup.button.callback('🏠 Home', 'go_home')]
      ];
      
      return ctx.editMessageText(
        `📑 *${chapter}*\n` +
        `📍 ${navPath}\n\n` +
        '📭 *No resources available yet*\n\n' +
        'We are updating the library every day.\n' +
        'Please check back soon!\n\n' +
        '_Tap the button below to get notified when content is added._',
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard(buttons)
        }
      );
    }
    
    // Build resource buttons
    const buttons = resources.map(resource => [
      Markup.button.callback(
        `${TYPE_ICONS[resource.type] || '📁'} ${resource.title}`,
        `resource_${resource._id}`
      )
    ]);
    
    // Add navigation buttons
    buttons.push([
      Markup.button.callback('⬅️ Back to Chapters', `course_${session.courseId}`)
    ]);
    buttons.push([
      Markup.button.callback('⬅️ Back to Courses', `semester_${session.semester}`)
    ]);
    
    // Edit message with resources
    await ctx.editMessageText(
      `📑 *${chapter}*\n` +
      `📘 Course: ${session.courseCode} – ${session.courseName}\n` +
      `📍 ${navPath}\n\n` +
      `📚 Found ${resources.length} resource(s):\n` +
      'Select a file to download:',
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard(buttons)
      }
    );
    
    console.log(`👤 User viewing resources for: ${chapter}`);
    
  } catch (error) {
    console.error('❌ Resource list error:', error.message);
    await ctx.answerCbQuery('⚠️ Something went wrong');
    await ctx.reply('⚠️ Something went wrong. Please try again later.');
  }
}

/**
 * Handle resource selection - Deliver file
 * @param {Object} ctx - Telegraf context
 */
async function handleResourceSelect(ctx) {
  try {
    await ctx.answerCbQuery('📥 Preparing your file...');
    
    // Extract resource ID
    const resourceId = ctx.callbackQuery.data.replace('resource_', '');
    
    // Fetch resource details with course info
    const resource = await Resource.findById(resourceId).populate('courseId');
    if (!resource) {
      return ctx.reply('❌ Resource not found. Please try again.');
    }
    
    // Get session for navigation
    const session = getSession(ctx.chat.id);
    const navPath = getNavigationPath(ctx.chat.id);
    
    // Get course info
    const courseName = resource.courseId?.name || session.courseName || 'Unknown Course';
    const courseCode = resource.courseId?.courseCode || session.courseCode || '';
    
    // Prepare info message
    const infoMessage = 
      `${TYPE_ICONS[resource.type] || '📁'} *${resource.title}*\n\n` +
      `📘 Course: ${courseCode} – ${courseName}\n` +
      `📑 Chapter: ${resource.chapter}\n` +
      `📍 ${navPath}`;
    
    // Try to send the file
    let fileSent = false;
    
    // Method 1: Check for URL-based file
    if (resource.fileUrl && resource.fileUrl.startsWith('http')) {
      try {
        await ctx.reply(`${infoMessage}\n\n📥 Downloading file...`, { parse_mode: 'Markdown' });
        
        // Send document from URL
        await ctx.replyWithDocument(
          { url: resource.fileUrl, filename: `${resource.title}.pdf` },
          {
            caption: `📚 ${resource.title}\n📑 ${resource.chapter}`,
            ...Markup.inlineKeyboard([
              [Markup.button.callback('⬅️ Back to Resources', `chapter_${encodeURIComponent(resource.chapter)}`)]
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
          await ctx.reply(`${infoMessage}\n\n📥 Sending file...`, { parse_mode: 'Markdown' });
          
          await ctx.replyWithDocument(
            { source: filePath },
            {
              caption: `📚 ${resource.title}\n📑 ${resource.chapter}`,
              ...Markup.inlineKeyboard([
                [Markup.button.callback('⬅️ Back to Resources', `chapter_${encodeURIComponent(resource.chapter)}`)]
              ])
            }
          );
          
          fileSent = true;
          
          // Increment download count
          await Resource.findByIdAndUpdate(resourceId, { $inc: { downloads: 1 } });
          
          console.log(`📤 Local file sent: ${resource.title} to ${ctx.from.username || ctx.from.id}`);
          
        } catch (localError) {
          console.error('❌ Local file error:', localError.message);
        }
      }
    }
    
    // If no file was sent, show error
    if (!fileSent) {
      const buttons = [
        [Markup.button.callback('🔔 Notify when fixed', `notify_interest_resource_${resourceId}`)],
        [Markup.button.callback('⬅️ Back to Resources', `chapter_${encodeURIComponent(resource.chapter)}`)],
        [Markup.button.callback('⬅️ Back to Chapters', `course_${session.courseId}`)],
        [Markup.button.callback('🏠 Home', 'go_home')]
      ];
      
      await ctx.editMessageText(
        `${infoMessage}\n\n` +
        '❌ *This resource is temporarily unavailable*\n\n' +
        'The library team has been notified.\n' +
        '_Please try again later or choose another resource._',
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard(buttons)
        }
      );
    }
    
  } catch (error) {
    console.error('❌ Resource delivery error:', error.message);
    await ctx.reply(
      '⚠️ Something went wrong. Please try again later.\n\n' +
      '_If this problem persists, please contact admin._',
      { parse_mode: 'Markdown' }
    );
  }
}

module.exports = { handleChapterSelect, handleResourceSelect };
