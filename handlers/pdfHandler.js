/**
 * ================================
 * PDF Handler (Day 11 Enhanced)
 * ================================
 * 
 * PDF preview, reading, and download with polished UI.
 */

const { Markup } = require('telegraf');
const path = require('path');
const fs = require('fs');
const Resource = require('../db/schemas/Resource');
const DownloadStat = require('../db/schemas/DownloadStat');
const ReadingProgress = require('../db/schemas/ReadingProgress');
const { extractPdfPreview, getPdfInfo, createZipFile } = require('../utils/pdfUtils');
const {
  EMOJI,
  ERRORS,
  NAV,
  getTypeIcon,
  showTyping,
  safeEditMessage,
  safeAnswerCallback
} = require('../utils/branding');

/**
 * Show resource preview with options
 */
async function showResourcePreview(ctx, resourceId) {
  try {
    // Show typing indicator
    await showTyping(ctx);
    
    const resource = await Resource.findById(resourceId).populate('courseId');
    if (!resource) {
      return ctx.reply(ERRORS.notFound);
    }
    
    const courseCode = resource.courseId?.courseCode || '';
    const courseName = resource.courseId?.name || '';
    
    // Get PDF info
    const filePath = path.join(process.cwd(), resource.filePath || '');
    let pdfInfo = { pageCount: 0, fileSizeMB: '0' };
    let previewText = '';
    
    if (fs.existsSync(filePath)) {
      pdfInfo = await getPdfInfo(filePath);
      const preview = await extractPdfPreview(filePath, 300);
      previewText = preview.text || '';
    }
    
    // Check for continue reading
    const oduserId = ctx.from.id.toString();
    const progress = await ReadingProgress.findOne({ oduserId, resourceId });
    
    // Build message
    let message = 
      `${getTypeIcon(resource.type)} *${resource.title}*\n\n` +
      `${EMOJI.course} Course: ${courseCode} – ${courseName}\n` +
      `${EMOJI.chapter} Chapter: ${resource.chapter}\n` +
      `${EMOJI.resource} Pages: ${pdfInfo.pageCount || 'N/A'}\n` +
      `💾 Size: ${pdfInfo.fileSizeMB || 'N/A'} MB\n`;
    
    if (previewText) {
      message += `\n${EMOJI.course} *Preview:*\n_"${previewText.substring(0, 200)}..."_\n`;
    }
    
    // Build buttons
    const buttons = [];
    
    // Continue reading option
    if (progress && progress.lastPage > 1) {
      buttons.push([
        Markup.button.callback(
          `📚 Continue from page ${progress.lastPage}`,
          `pdf_continue_${resourceId}`
        )
      ]);
    }
    
    buttons.push([
      Markup.button.callback(`${EMOJI.course} Read Preview`, `pdf_preview_${resourceId}`),
      Markup.button.callback(`${EMOJI.download} Download`, `pdf_download_${resourceId}`)
    ]);
    
    buttons.push([
      Markup.button.callback('🗜️ Download ZIP', `pdf_zip_${resourceId}`),
      Markup.button.callback(`${EMOJI.favorites} Favorite`, `fav_add_${resourceId}`)
    ]);
    
    // AI Study Tools - only show if file exists
    if (fs.existsSync(filePath)) {
      buttons.push([
        Markup.button.callback('🧠 AI Summary', `ai_summary_${resourceId}`),
        Markup.button.callback('🔖 Flashcards', `ai_flashcards_${resourceId}`)
      ]);
      
      buttons.push([
        Markup.button.callback('📝 Generate Quiz', `ai_quiz_${resourceId}`),
        Markup.button.callback('🧩 Mind Map', `ai_mindmap_${resourceId}`)
      ]);
    } else {
      message += `\n⚠️ _AI features unavailable - file not uploaded yet_\n`;
    }
    
    buttons.push([
      Markup.button.callback(NAV.backTo('Resources'), `chapter_${encodeURIComponent(resource.chapter)}`)
    ]);
    
    buttons.push([
      Markup.button.callback(NAV.home, 'go_home'),
      Markup.button.callback(NAV.search, 'go_search')
    ]);
    
    // Record stat
    await DownloadStat.create({ oduserId, resourceId, action: 'preview' });
    
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
    
  } catch (error) {
    console.error('❌ Resource preview error:', error.message);
    await ctx.reply(ERRORS.general);
  }
}

/**
 * Handle PDF preview (text extract)
 */
async function handlePdfPreview(ctx) {
  try {
    await safeAnswerCallback(ctx, `${EMOJI.loading} Loading preview...`);
    await showTyping(ctx);
    
    const resourceId = ctx.callbackQuery.data.replace('pdf_preview_', '');
    const resource = await Resource.findById(resourceId).populate('courseId');
    
    if (!resource) {
      return ctx.reply(ERRORS.notFound);
    }
    
    const filePath = path.join(process.cwd(), resource.filePath || '');
    
    if (!fs.existsSync(filePath)) {
      return ctx.reply(
        `${EMOJI.warning} File not available for preview.\n\n` +
        `_The file may not be uploaded yet._`,
        { parse_mode: 'Markdown' }
      );
    }
    
    const preview = await extractPdfPreview(filePath, 1000);
    
    const message = 
      `${EMOJI.course} *Preview: ${resource.title}*\n\n` +
      `${EMOJI.resource} Total Pages: ${preview.pageCount}\n\n` +
      `───────────────\n` +
      `${preview.text || 'No text content available.'}\n` +
      `───────────────`;
    
    const buttons = [
      [Markup.button.callback(`${EMOJI.download} Download Full PDF`, `pdf_download_${resourceId}`)],
      [Markup.button.callback(NAV.back, `resource_${resourceId}`)]
    ];
    
    await safeEditMessage(ctx, message, {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard(buttons)
    });
    
  } catch (error) {
    console.error('❌ PDF preview error:', error.message);
    await ctx.answerCbQuery('Failed to load preview');
  }
}

/**
 * Handle PDF download
 */
async function handlePdfDownload(ctx) {
  try {
    await safeAnswerCallback(ctx, `${EMOJI.download} Preparing download...`);
    await showTyping(ctx);
    
    const resourceId = ctx.callbackQuery.data.replace('pdf_download_', '');
    const resource = await Resource.findById(resourceId).populate('courseId');
    
    if (!resource) {
      return ctx.reply(ERRORS.notFound);
    }
    
    const filePath = path.join(process.cwd(), resource.filePath || '');
    const oduserId = ctx.from.id.toString();
    
    // Try URL first
    if (resource.fileUrl && resource.fileUrl.startsWith('http')) {
      try {
        await ctx.replyWithDocument(
          { url: resource.fileUrl, filename: `${resource.title}.pdf` },
          { caption: `${EMOJI.resource} ${resource.title}\n${EMOJI.chapter} ${resource.chapter}` }
        );
        
        await DownloadStat.create({ oduserId, resourceId, action: 'download' });
        await Resource.findByIdAndUpdate(resourceId, { $inc: { downloads: 1 } });
        return;
      } catch (e) {
        console.error('URL download failed:', e.message);
      }
    }
    
    // Try local file
    if (fs.existsSync(filePath)) {
      await ctx.replyWithDocument(
        { source: filePath },
        { caption: `${EMOJI.resource} ${resource.title}\n${EMOJI.chapter} ${resource.chapter}` }
      );
      
      await DownloadStat.create({ oduserId, resourceId, action: 'download' });
      await Resource.findByIdAndUpdate(resourceId, { $inc: { downloads: 1 } });
      return;
    }
    
    // File not available
    await ctx.reply(
      `${EMOJI.warning} Sorry, this file is not available for download yet.\n\n` +
      `_Please contact admin if this persists._`,
      { parse_mode: 'Markdown' }
    );
    
  } catch (error) {
    console.error('❌ PDF download error:', error.message);
    await ctx.reply(ERRORS.general);
  }
}

/**
 * Handle ZIP download
 */
async function handleZipDownload(ctx) {
  try {
    await safeAnswerCallback(ctx, '🗜️ Creating ZIP...');
    await showTyping(ctx);
    
    const resourceId = ctx.callbackQuery.data.replace('pdf_zip_', '');
    const resource = await Resource.findById(resourceId);
    
    if (!resource) {
      return ctx.reply(ERRORS.notFound);
    }
    
    const filePath = path.join(process.cwd(), resource.filePath || '');
    
    if (!fs.existsSync(filePath)) {
      return ctx.reply(`${EMOJI.warning} File not available for ZIP.`);
    }
    
    await ctx.reply(`${EMOJI.loading} Creating ZIP file, please wait...`);
    
    const zipPath = await createZipFile(filePath, resource.title, resource.chapter);
    
    await ctx.replyWithDocument(
      { source: zipPath },
      { caption: `🗜️ ${resource.title}.zip\n${EMOJI.chapter} ${resource.chapter}` }
    );
    
    // Cleanup ZIP after sending
    setTimeout(() => {
      try { fs.unlinkSync(zipPath); } catch {}
    }, 60000);
    
  } catch (error) {
    console.error('❌ ZIP error:', error.message);
    await ctx.reply(ERRORS.general);
  }
}

/**
 * Handle continue reading
 */
async function handleContinueReading(ctx) {
  try {
    await safeAnswerCallback(ctx);
    
    const resourceId = ctx.callbackQuery.data.replace('pdf_continue_', '');
    const oduserId = ctx.from.id.toString();
    
    const progress = await ReadingProgress.findOne({ oduserId, resourceId });
    
    if (progress) {
      await ctx.reply(
        `📚 *Continue Reading*\n\n` +
        `You were on page ${progress.lastPage} of ${progress.totalPages}.\n\n` +
        `_Full PDF reader coming soon!_\n` +
        `_For now, download the PDF to continue._`,
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [Markup.button.callback(`${EMOJI.download} Download PDF`, `pdf_download_${resourceId}`)],
            [Markup.button.callback(NAV.back, `resource_${resourceId}`)]
          ])
        }
      );
    }
    
  } catch (error) {
    console.error('❌ Continue reading error:', error.message);
  }
}

/**
 * Save reading progress
 */
async function saveReadingProgress(oduserId, resourceId, page, totalPages) {
  try {
    await ReadingProgress.findOneAndUpdate(
      { oduserId, resourceId },
      { lastPage: page, totalPages, updatedAt: new Date() },
      { upsert: true }
    );
  } catch (error) {
    console.error('❌ Save progress error:', error.message);
  }
}

module.exports = {
  showResourcePreview,
  handlePdfPreview,
  handlePdfDownload,
  handleZipDownload,
  handleContinueReading,
  saveReadingProgress
};
