/**
 * ================================
 * History Handler
 * ================================
 * 
 * Tracks and displays user browsing history.
 */

const { Markup } = require('telegraf');
const History = require('../db/schemas/History');
const Resource = require('../db/schemas/Resource');
const { getCommonButtons } = require('./menuHandler');

const ITEMS_PER_PAGE = 5;
const MAX_HISTORY = 100; // Keep last 100 items per user

/**
 * Record a history entry
 */
async function recordHistory(oduserId, resourceId, action = 'view') {
  try {
    // Add new entry
    await History.create({ oduserId, resourceId, action });
    
    // Clean old entries (keep only last MAX_HISTORY)
    const count = await History.countDocuments({ oduserId });
    if (count > MAX_HISTORY) {
      const oldEntries = await History.find({ oduserId })
        .sort({ timestamp: 1 })
        .limit(count - MAX_HISTORY);
      
      const idsToDelete = oldEntries.map(e => e._id);
      await History.deleteMany({ _id: { $in: idsToDelete } });
    }
    
  } catch (error) {
    console.error('❌ Record history error:', error.message);
  }
}

/**
 * Handle /history command
 */
async function handleHistory(ctx) {
  await showHistory(ctx, 0);
}

/**
 * Show history with pagination
 */
async function showHistory(ctx, page = 0) {
  try {
    const oduserId = ctx.from.id.toString();
    
    // Count total history
    const total = await History.countDocuments({ oduserId });
    
    if (total === 0) {
      const buttons = getCommonButtons();
      return ctx.reply(
        '🕘 *Your History*\n\n' +
        '📭 Your history is empty.\n\n' +
        '_Start browsing resources to see them here._',
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard(buttons)
        }
      );
    }
    
    // Fetch history with pagination
    const history = await History.find({ oduserId })
      .sort({ timestamp: -1 })
      .skip(page * ITEMS_PER_PAGE)
      .limit(ITEMS_PER_PAGE)
      .populate({
        path: 'resourceId',
        populate: { path: 'courseId' }
      });
    
    const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
    
    // Build buttons
    const buttons = [];
    
    history.forEach(h => {
      if (h.resourceId) {
        const r = h.resourceId;
        const courseCode = r.courseId?.courseCode || '';
        const time = formatTime(h.timestamp);
        buttons.push([
          Markup.button.callback(
            `📄 ${r.title.substring(0, 25)}... (${time})`,
            `resource_${r._id}`
          )
        ]);
      }
    });
    
    // Pagination buttons
    const navRow = [];
    if (page > 0) {
      navRow.push(Markup.button.callback('◀️ Prev', `hist_page_${page - 1}`));
    }
    navRow.push(Markup.button.callback(`${page + 1}/${totalPages}`, 'noop'));
    if (page < totalPages - 1) {
      navRow.push(Markup.button.callback('Next ▶️', `hist_page_${page + 1}`));
    }
    if (navRow.length > 0) buttons.push(navRow);
    
    // Clear history button
    buttons.push([
      Markup.button.callback('🗑️ Clear History', 'hist_clear')
    ]);
    
    // Common navigation
    buttons.push([
      Markup.button.callback('🏠 Home', 'go_home'),
      Markup.button.callback('⭐ Favorites', 'go_favorites')
    ]);
    
    const message = 
      `🕘 *Your History*\n\n` +
      `📚 ${total} item(s) in history\n` +
      `📄 Page ${page + 1} of ${totalPages}\n\n` +
      `_Showing your recent activity_`;
    
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
    
  } catch (error) {
    console.error('❌ History error:', error.message);
    await ctx.reply('⚠️ Something went wrong. Please try again.');
  }
}

/**
 * Handle history pagination
 */
async function handleHistoryPage(ctx) {
  try {
    await ctx.answerCbQuery();
    const page = parseInt(ctx.callbackQuery.data.replace('hist_page_', ''));
    await showHistory(ctx, page);
  } catch (error) {
    console.error('❌ History page error:', error.message);
  }
}

/**
 * Clear user history
 */
async function clearHistory(ctx) {
  try {
    await ctx.answerCbQuery();
    
    const oduserId = ctx.from.id.toString();
    await History.deleteMany({ oduserId });
    
    await ctx.editMessageText(
      '🕘 *Your History*\n\n' +
      '✅ History cleared successfully!',
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard(getCommonButtons())
      }
    );
    
  } catch (error) {
    console.error('❌ Clear history error:', error.message);
    await ctx.answerCbQuery('Failed to clear history');
  }
}

/**
 * Format timestamp to relative time
 */
function formatTime(date) {
  const now = new Date();
  const diff = now - new Date(date);
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  if (hours < 24) return `${hours}h`;
  return `${days}d`;
}

module.exports = {
  recordHistory,
  handleHistory,
  showHistory,
  handleHistoryPage,
  clearHistory
};
