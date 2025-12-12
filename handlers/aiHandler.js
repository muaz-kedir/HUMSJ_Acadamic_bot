/**
 * ================================
 * AI Handler (Day 12-13)
 * ================================
 * 
 * Handles AI-powered features:
 * - Document summarization
 * - Flashcard generation
 * - Quiz generation
 * - Mind map generation
 */

const { Markup } = require('telegraf');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const Resource = require('../db/schemas/Resource');
const AICache = require('../db/schemas/AICache');
const { extractPdfPreview } = require('../utils/pdfUtils');
const {
  generateSummary,
  generateFlashcards,
  generateQuiz,
  generateMindMapConcepts,
  isAIAvailable
} = require('../utils/aiService');
const {
  EMOJI,
  ERRORS,
  NAV,
  showTyping,
  safeEditMessage,
  safeAnswerCallback
} = require('../utils/branding');
const { log } = require('../utils/logger');

// AI Rate limiting (3 requests per minute per user)
const aiRateLimits = new Map();
const AI_RATE_LIMIT = 3;
const AI_RATE_WINDOW = 60000;

/**
 * Check AI rate limit
 */
function checkAIRateLimit(userId) {
  const now = Date.now();
  const key = userId.toString();
  
  if (!aiRateLimits.has(key)) {
    aiRateLimits.set(key, { count: 1, windowStart: now });
    return { allowed: true, remaining: AI_RATE_LIMIT - 1 };
  }
  
  const data = aiRateLimits.get(key);
  
  if (now - data.windowStart > AI_RATE_WINDOW) {
    aiRateLimits.set(key, { count: 1, windowStart: now });
    return { allowed: true, remaining: AI_RATE_LIMIT - 1 };
  }
  
  if (data.count >= AI_RATE_LIMIT) {
    const resetIn = Math.ceil((AI_RATE_WINDOW - (now - data.windowStart)) / 1000);
    return { allowed: false, remaining: 0, resetIn };
  }
  
  data.count++;
  return { allowed: true, remaining: AI_RATE_LIMIT - data.count };
}

/**
 * Get text hash for caching
 */
function getTextHash(text) {
  return crypto.createHash('md5').update(text.substring(0, 1000)).digest('hex');
}

/**
 * Extract text from resource
 */
async function extractResourceText(resource) {
  // Check if resource has a file path
  if (!resource.filePath && !resource.fileUrl) {
    throw new Error('No file available for this resource. Please upload a file first using /admin.');
  }
  
  const filePath = path.join(process.cwd(), resource.filePath || '');
  
  // Check if local file exists
  if (!resource.filePath || !fs.existsSync(filePath)) {
    if (resource.fileUrl) {
      throw new Error('This resource uses an external URL. AI features require a local PDF file.');
    }
    throw new Error('Resource file not found on server. Please upload the file using /admin.');
  }
  
  try {
    const preview = await extractPdfPreview(filePath, 25000);
    
    if (!preview.text || preview.text.length < 100) {
      throw new Error('Could not extract enough text from PDF. The file may be image-based or corrupted.');
    }
    
    return preview.text;
  } catch (err) {
    if (err.message.includes('extract')) throw err;
    throw new Error(`Failed to read PDF: ${err.message}`);
  }
}

/**
 * Handle AI summary request
 */
async function handleAISummary(ctx) {
  try {
    await safeAnswerCallback(ctx, `${EMOJI.loading} Generating summary...`);
    
    // Check if AI is available
    if (!isAIAvailable()) {
      return ctx.reply(
        `${EMOJI.warning} *AI Service Unavailable*\n\n` +
        `The AI summarization feature is not configured.\n` +
        `Please contact the administrator.`,
        { parse_mode: 'Markdown' }
      );
    }
    
    // Check rate limit
    const rateCheck = checkAIRateLimit(ctx.from.id);
    if (!rateCheck.allowed) {
      return ctx.reply(
        `${EMOJI.warning} *Slow down!*\n\n` +
        `You're making too many AI requests.\n` +
        `Please wait ${rateCheck.resetIn} seconds.`,
        { parse_mode: 'Markdown' }
      );
    }
    
    const resourceId = ctx.callbackQuery.data.replace('ai_summary_', '');
    const resource = await Resource.findById(resourceId).populate('courseId');
    
    if (!resource) {
      return ctx.reply(ERRORS.notFound);
    }
    
    // Show loading message
    await showTyping(ctx);
    const loadingMsg = await ctx.reply(
      `${EMOJI.loading} *Generating AI Summary...*\n\n` +
      `📄 Resource: ${resource.title}\n` +
      `_This may take 15-30 seconds..._`,
      { parse_mode: 'Markdown' }
    );
    
    // Check cache first
    const text = await extractResourceText(resource);
    const textHash = getTextHash(text);
    
    const cached = await AICache.findOne({
      resourceId: resource._id,
      type: 'summary',
      textHash
    });
    
    let summary;
    if (cached) {
      summary = cached.content;
      log.info('AI summary served from cache', { resourceId: resource._id.toString() });
    } else {
      // Generate new summary
      summary = await generateSummary(text, resource.title);
      
      // Cache the result
      await AICache.findOneAndUpdate(
        { resourceId: resource._id, type: 'summary' },
        { content: summary, textHash, createdAt: new Date() },
        { upsert: true }
      );
      
      log.userAction(ctx.from.id, 'ai_summary', { resourceId: resource._id.toString() });
    }
    
    // Delete loading message
    try { await ctx.deleteMessage(loadingMsg.message_id); } catch {}
    
    // Send short summary
    await ctx.reply(
      `🧠 *AI Summary*\n` +
      `📄 ${resource.title}\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `📝 *Quick Summary:*\n${summary.short}\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━`,
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('📖 View Detailed Summary', `ai_summary_long_${resourceId}`)],
          [Markup.button.callback(NAV.back, `resource_${resourceId}`)]
        ])
      }
    );
    
  } catch (error) {
    log.error('AI summary error', { error: error.message });
    await ctx.reply(
      `${EMOJI.warning} *Summary Generation Failed*\n\n` +
      `${error.message}\n\n` +
      `_Please try again later._`,
      { parse_mode: 'Markdown' }
    );
  }
}

/**
 * Handle detailed summary view
 */
async function handleAISummaryLong(ctx) {
  try {
    await safeAnswerCallback(ctx);
    
    const resourceId = ctx.callbackQuery.data.replace('ai_summary_long_', '');
    
    const cached = await AICache.findOne({
      resourceId,
      type: 'summary'
    });
    
    if (!cached) {
      return ctx.reply('Summary not found. Please generate again.');
    }
    
    const resource = await Resource.findById(resourceId);
    
    // Split long summary if needed
    const longSummary = cached.content.long || cached.content.raw;
    
    if (longSummary.length > 3500) {
      const parts = splitMessage(longSummary, 3500);
      for (let i = 0; i < parts.length; i++) {
        if (i === parts.length - 1) {
          await ctx.reply(parts[i], {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
              [Markup.button.callback(NAV.back, `resource_${resourceId}`)]
            ])
          });
        } else {
          await ctx.reply(parts[i], { parse_mode: 'Markdown' });
        }
      }
    } else {
      await ctx.reply(
        `📖 *Detailed Summary*\n` +
        `📄 ${resource?.title || 'Document'}\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `${longSummary}`,
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [Markup.button.callback(NAV.back, `resource_${resourceId}`)]
          ])
        }
      );
    }
    
  } catch (error) {
    log.error('AI summary long error', { error: error.message });
    await ctx.reply(ERRORS.general);
  }
}

/**
 * Handle flashcard generation
 */
async function handleAIFlashcards(ctx) {
  try {
    await safeAnswerCallback(ctx, `${EMOJI.loading} Generating flashcards...`);
    
    if (!isAIAvailable()) {
      return ctx.reply(`${EMOJI.warning} AI Service not configured.`);
    }
    
    const rateCheck = checkAIRateLimit(ctx.from.id);
    if (!rateCheck.allowed) {
      return ctx.reply(
        `${EMOJI.warning} Too many requests. Wait ${rateCheck.resetIn}s.`,
        { parse_mode: 'Markdown' }
      );
    }
    
    const resourceId = ctx.callbackQuery.data.replace('ai_flashcards_', '');
    const resource = await Resource.findById(resourceId);
    
    if (!resource) return ctx.reply(ERRORS.notFound);
    
    await showTyping(ctx);
    const loadingMsg = await ctx.reply(
      `${EMOJI.loading} *Generating Flashcards...*\n\n` +
      `📄 ${resource.title}\n` +
      `_Creating 20-30 study cards..._`,
      { parse_mode: 'Markdown' }
    );
    
    // Check cache
    const text = await extractResourceText(resource);
    const textHash = getTextHash(text);
    
    const cached = await AICache.findOne({
      resourceId: resource._id,
      type: 'flashcards',
      textHash
    });
    
    let flashcards;
    if (cached) {
      flashcards = cached.content;
    } else {
      flashcards = await generateFlashcards(text, resource.title);
      
      await AICache.findOneAndUpdate(
        { resourceId: resource._id, type: 'flashcards' },
        { content: flashcards, textHash, createdAt: new Date() },
        { upsert: true }
      );
      
      log.userAction(ctx.from.id, 'ai_flashcards', { resourceId: resource._id.toString() });
    }
    
    try { await ctx.deleteMessage(loadingMsg.message_id); } catch {}
    
    // Send flashcards paginated
    await sendFlashcards(ctx, flashcards, resource.title, resourceId, 0);
    
  } catch (error) {
    log.error('AI flashcards error', { error: error.message });
    await ctx.reply(`${EMOJI.warning} Failed to generate flashcards: ${error.message}`);
  }
}

/**
 * Send flashcards with pagination
 */
async function sendFlashcards(ctx, flashcards, title, resourceId, page) {
  const perPage = 5;
  const start = page * perPage;
  const end = Math.min(start + perPage, flashcards.length);
  const totalPages = Math.ceil(flashcards.length / perPage);
  
  let message = `🔖 *Flashcards: ${title}*\n`;
  message += `📄 Page ${page + 1}/${totalPages} (${flashcards.length} cards)\n\n`;
  
  for (let i = start; i < end; i++) {
    const card = flashcards[i];
    message += `━━━━━━━━━━━━━━━━━━━━━\n`;
    message += `*Card ${i + 1}*\n`;
    message += `❓ ${card.front}\n\n`;
    message += `✅ ||${card.back}||\n\n`;
  }
  
  const buttons = [];
  const navRow = [];
  
  if (page > 0) {
    navRow.push(Markup.button.callback('◀️ Prev', `fc_page_${resourceId}_${page - 1}`));
  }
  navRow.push(Markup.button.callback(`${page + 1}/${totalPages}`, 'noop'));
  if (page < totalPages - 1) {
    navRow.push(Markup.button.callback('Next ▶️', `fc_page_${resourceId}_${page + 1}`));
  }
  
  if (navRow.length > 0) buttons.push(navRow);
  buttons.push([Markup.button.callback(NAV.back, `resource_${resourceId}`)]);
  
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
}

/**
 * Handle flashcard pagination
 */
async function handleFlashcardPage(ctx) {
  try {
    await safeAnswerCallback(ctx);
    
    const data = ctx.callbackQuery.data.replace('fc_page_', '');
    const [resourceId, pageStr] = data.split('_');
    const page = parseInt(pageStr);
    
    const cached = await AICache.findOne({ resourceId, type: 'flashcards' });
    if (!cached) return ctx.reply('Flashcards expired. Please generate again.');
    
    const resource = await Resource.findById(resourceId);
    await sendFlashcards(ctx, cached.content, resource?.title || 'Document', resourceId, page);
    
  } catch (error) {
    log.error('Flashcard page error', { error: error.message });
  }
}

/**
 * Handle quiz generation
 */
async function handleAIQuiz(ctx) {
  try {
    await safeAnswerCallback(ctx, `${EMOJI.loading} Generating quiz...`);
    
    if (!isAIAvailable()) {
      return ctx.reply(`${EMOJI.warning} AI Service not configured.`);
    }
    
    const rateCheck = checkAIRateLimit(ctx.from.id);
    if (!rateCheck.allowed) {
      return ctx.reply(`${EMOJI.warning} Too many requests. Wait ${rateCheck.resetIn}s.`);
    }
    
    const resourceId = ctx.callbackQuery.data.replace('ai_quiz_', '');
    const resource = await Resource.findById(resourceId);
    
    if (!resource) return ctx.reply(ERRORS.notFound);
    
    await showTyping(ctx);
    const loadingMsg = await ctx.reply(
      `${EMOJI.loading} *Generating Quiz...*\n\n` +
      `📄 ${resource.title}\n` +
      `_Creating 30 questions..._`,
      { parse_mode: 'Markdown' }
    );
    
    const text = await extractResourceText(resource);
    const textHash = getTextHash(text);
    
    const cached = await AICache.findOne({
      resourceId: resource._id,
      type: 'quiz',
      textHash
    });
    
    let quiz;
    if (cached) {
      quiz = cached.content;
    } else {
      quiz = await generateQuiz(text, resource.title);
      
      await AICache.findOneAndUpdate(
        { resourceId: resource._id, type: 'quiz' },
        { content: quiz, textHash, createdAt: new Date() },
        { upsert: true }
      );
      
      log.userAction(ctx.from.id, 'ai_quiz', { resourceId: resource._id.toString() });
    }
    
    try { await ctx.deleteMessage(loadingMsg.message_id); } catch {}
    
    // Split quiz if too long
    const header = `📝 *Quiz: ${resource.title}*\n━━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    if (quiz.length > 3500) {
      const parts = splitMessage(quiz, 3500);
      await ctx.reply(header + parts[0], { parse_mode: 'Markdown' });
      
      for (let i = 1; i < parts.length; i++) {
        if (i === parts.length - 1) {
          await ctx.reply(parts[i], {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
              [Markup.button.callback(NAV.back, `resource_${resourceId}`)]
            ])
          });
        } else {
          await ctx.reply(parts[i], { parse_mode: 'Markdown' });
        }
      }
    } else {
      await ctx.reply(header + quiz, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback(NAV.back, `resource_${resourceId}`)]
        ])
      });
    }
    
  } catch (error) {
    log.error('AI quiz error', { error: error.message });
    await ctx.reply(`${EMOJI.warning} Failed to generate quiz: ${error.message}`);
  }
}

/**
 * Handle mind map generation
 */
async function handleAIMindMap(ctx) {
  try {
    await safeAnswerCallback(ctx, `${EMOJI.loading} Creating mind map...`);
    
    if (!isAIAvailable()) {
      return ctx.reply(`${EMOJI.warning} AI Service not configured.`);
    }
    
    const rateCheck = checkAIRateLimit(ctx.from.id);
    if (!rateCheck.allowed) {
      return ctx.reply(`${EMOJI.warning} Too many requests. Wait ${rateCheck.resetIn}s.`);
    }
    
    const resourceId = ctx.callbackQuery.data.replace('ai_mindmap_', '');
    const resource = await Resource.findById(resourceId);
    
    if (!resource) return ctx.reply(ERRORS.notFound);
    
    await showTyping(ctx);
    const loadingMsg = await ctx.reply(
      `${EMOJI.loading} *Creating Mind Map...*\n\n` +
      `📄 ${resource.title}\n` +
      `_Organizing concepts..._`,
      { parse_mode: 'Markdown' }
    );
    
    const text = await extractResourceText(resource);
    const textHash = getTextHash(text);
    
    const cached = await AICache.findOne({
      resourceId: resource._id,
      type: 'mindmap',
      textHash
    });
    
    let mindmap;
    if (cached) {
      mindmap = cached.content;
    } else {
      mindmap = await generateMindMapConcepts(text, resource.title);
      
      await AICache.findOneAndUpdate(
        { resourceId: resource._id, type: 'mindmap' },
        { content: mindmap, textHash, createdAt: new Date() },
        { upsert: true }
      );
      
      log.userAction(ctx.from.id, 'ai_mindmap', { resourceId: resource._id.toString() });
    }
    
    try { await ctx.deleteMessage(loadingMsg.message_id); } catch {}
    
    await ctx.reply(
      `🧩 *Mind Map: ${resource.title}*\n\n` +
      `${mindmap}`,
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback(NAV.back, `resource_${resourceId}`)]
        ])
      }
    );
    
  } catch (error) {
    log.error('AI mindmap error', { error: error.message });
    await ctx.reply(`${EMOJI.warning} Failed to create mind map: ${error.message}`);
  }
}

/**
 * Split long message
 */
function splitMessage(text, maxLength) {
  const parts = [];
  let current = '';
  
  const lines = text.split('\n');
  for (const line of lines) {
    if ((current + line + '\n').length > maxLength) {
      parts.push(current);
      current = line + '\n';
    } else {
      current += line + '\n';
    }
  }
  
  if (current) parts.push(current);
  return parts;
}

module.exports = {
  handleAISummary,
  handleAISummaryLong,
  handleAIFlashcards,
  handleFlashcardPage,
  handleAIQuiz,
  handleAIMindMap,
  checkAIRateLimit
};
