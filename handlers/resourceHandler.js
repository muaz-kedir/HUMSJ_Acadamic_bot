/**
 * ================================
 * Resource Handler
 * ================================
 * 
 * Triggered when user selects a chapter.
 * Shows available resources (PDFs, slides, etc.) for that chapter.
 * Handles file delivery to user.
 */

const { Markup } = require('telegraf');
const path = require('path');
const fs = require('fs');
const Resource = require('../db/schemas/Resource');
const { updateSession, getSession, getNavigationPath } = require('../utils/sessionManager');

/**
 * Handle chapter selection - Show resources
 * @param {Object} ctx - Telegraf context
 */
async function handleChapterSelect(ctx) {
  try {
    // Acknowledge callback query
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
        [Markup.button.callback('⬅️ Back to Chapters', `course_${session.courseId}`)]
      ];
      
      return ctx.editMessageText(
        `📑 *${chapter}*\n` +
        `📍 ${navPath}\n\n` +
        '📭 This chapter does not have any available resources.\n' +
        'Please check back later.',
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard(buttons)
        }
      );
    }
    
    // Build resource buttons with type icons
    const typeIcons = {
      pdf: '📄',
      slide: '📊',
      book: '📖',
      exam: '📝'
    };
    
    const buttons = resources.map(resource => [
      Markup.button.callback(
        `${typeIcons[resource.type] || '📁'} ${resource.title}`,
        `resource_${resource._id}`
      )
    ]);
    
    // Add back button
    buttons.push([Markup.button.callback('⬅️ Back to Chapters', `course_${session.courseId}`)]);
    
    // Edit message with resources
    await ctx.editMessageText(
      `📑 *${chapter}*\n` +
      `📍 ${navPath}\n\n` +
      `Found ${resources.length} resource(s):\n` +
      'Select a resource to download:',
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard(buttons)
      }
    );
    
    console.log(`👤 User viewing resources for: ${chapter}`);
    
  } catch (error) {
    console.error('❌ Resource list error:', error.message);
    await ctx.answerCbQuery('An error occurred');
    await ctx.reply('❌ An error occurred. Please try /browse again.');
  }
}

/**
 * Handle resource selection - Deliver file
 * @param {Object} ctx - Telegraf context
 */
async function handleResourceSelect(ctx) {
  try {
    // Acknowledge callback query
    await ctx.answerCbQuery('📥 Preparing your file...');
    
    // Extract resource ID from callback data
    const resourceId = ctx.callbackQuery.data.replace('resource_', '');
    
    // Fetch resource details
    const resource = await Resource.findById(resourceId);
    if (!resource) {
      return ctx.reply('❌ Resource not found. Please try again.');
    }
    
    // Get session for navigation
    const session = getSession(ctx.chat.id);
    const navPath = getNavigationPath(ctx.chat.id);
    
    // Type icons
    const typeIcons = {
      pdf: '📄',
      slide: '📊',
      book: '📖',
      exam: '📝'
    };
    
    // Validate file type (only PDF supported for now)
    const supportedTypes = ['pdf', 'book', 'exam', 'slide'];
    if (!supportedTypes.includes(resource.type)) {
      return ctx.reply(
        `❌ This resource type (${resource.type}) is not supported yet.\n` +
        'Only PDFs are supported at this time.'
      );
    }
    
    // Build file path
    const filePath = path.join(process.cwd(), resource.filePath);
    
    // Check if file exists locally
    if (fs.existsSync(filePath)) {
      // Send local file
      try {
        // Send info message first
        await ctx.reply(
          `${typeIcons[resource.type] || '📁'} *${resource.title}*\n` +
          `📑 ${resource.chapter}\n` +
          `📍 ${navPath}\n\n` +
          '📥 Sending your file...',
          { parse_mode: 'Markdown' }
        );
        
        // Send the document
        await ctx.replyWithDocument(
          { source: filePath },
          {
            caption: `📚 ${resource.title}\n📑 ${resource.chapter}`,
            ...Markup.inlineKeyboard([
              [Markup.button.callback('⬅️ Back to Resources', `chapter_${encodeURIComponent(session.chapter)}`)]
            ])
          }
        );
        
        console.log(`📤 File sent: ${resource.title} to user ${ctx.from.username || ctx.from.id}`);
        
      } catch (sendError) {
        console.error('❌ File send error:', sendError.message);
        await ctx.reply(
          '❌ Failed to send this file.\n' +
          'The file may be too large or corrupted.\n' +
          'Please try again later.'
        );
      }
      
    } else {
      // File doesn't exist locally - show placeholder message
      // In production, you would fetch from cloud storage
      
      const buttons = [
        [Markup.button.callback('⬅️ Back to Resources', `chapter_${encodeURIComponent(session.chapter)}`)]
      ];
      
      await ctx.editMessageText(
        `${typeIcons[resource.type] || '📁'} *${resource.title}*\n` +
        `📑 ${resource.chapter}\n` +
        `📍 ${navPath}\n\n` +
        `📂 *File Path:* \`${resource.filePath}\`\n\n` +
        '⚠️ *Note:* This is a sample resource.\n' +
        'In production, the actual PDF would be delivered here.\n\n' +
        'To test with real files:\n' +
        '1. Place PDF files in the uploads folder\n' +
        '2. Update the filePath in the database',
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard(buttons)
        }
      );
      
      console.log(`⚠️ File not found: ${resource.filePath}`);
    }
    
  } catch (error) {
    console.error('❌ Resource delivery error:', error.message);
    await ctx.reply(
      '❌ Failed to load this resource.\n' +
      'Please try again later.'
    );
  }
}

module.exports = { handleChapterSelect, handleResourceSelect };
