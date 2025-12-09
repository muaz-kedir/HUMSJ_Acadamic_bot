/**
 * ================================
 * Favorites Handler
 * ================================
 * 
 * Manages user favorites - add, remove, list.
 */

const { Markup } = require('telegraf');
const Favorite = require('../db/schemas/Favorite');
const Resource = require('../db/schemas/Resource');
const { getCommonButtons } = require('./menuHandler');

const ITEMS_PER_PAGE = 5;

/**
 * Handle /favorites command
 */
async function handleFavorites(ctx) {
  await showFavorites(ctx, 0);
}

/**
 * Show favorites list with pagination
 */
async function showFavorites(ctx, page = 0) {
  try {
    const oduserId = ctx.from.id.toString();
    
    // Count total favorites
    const total = await Favorite.countDocuments({ oduserId });
    
    if (total === 0) {
      const buttons = getCommonButtons();
      return ctx.reply(
        '⭐ *Your Favorites*\n\n' +
        '📭 Your favorites list is empty.\n\n' +
        '_Browse resources and tap "⭐ Add to Favorites" to save them here._',
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard(buttons)
        }
      );
    }
    
    // Fetch favorites with pagination
    const favorites = await Favorite.find({ oduserId })
      .sort({ addedAt: -1 })
      .skip(page * ITEMS_PER_PAGE)
      .limit(ITEMS_PER_PAGE)
      .populate({
        path: 'resourceId',
        populate: { path: 'courseId' }
      });
    
    const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
    
    // Build buttons
    const buttons = [];
    
    favorites.forEach(fav => {
      if (fav.resourceId) {
        const r = fav.resourceId;
        const courseCode = r.courseId?.courseCode || '';
        buttons.push([
          Markup.button.callback(
            `📄 ${r.title} (${courseCode})`,
            `resource_${r._id}`
          ),
          Markup.button.callback('❌', `fav_remove_${fav._id}`)
        ]);
      }
    });
    
    // Pagination buttons
    const navRow = [];
    if (page > 0) {
      navRow.push(Markup.button.callback('◀️ Prev', `fav_page_${page - 1}`));
    }
    navRow.push(Markup.button.callback(`${page + 1}/${totalPages}`, 'noop'));
    if (page < totalPages - 1) {
      navRow.push(Markup.button.callback('Next ▶️', `fav_page_${page + 1}`));
    }
    if (navRow.length > 0) buttons.push(navRow);
    
    // Common navigation
    buttons.push([
      Markup.button.callback('🏠 Home', 'go_home'),
      Markup.button.callback('🔍 Search', 'go_search')
    ]);
    
    const message = 
      `⭐ *Your Favorites*\n\n` +
      `📚 ${total} saved resource(s)\n` +
      `📄 Page ${page + 1} of ${totalPages}\n\n` +
      `_Tap ❌ to remove from favorites_`;
    
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
    console.error('❌ Favorites error:', error.message);
    await ctx.reply('⚠️ Something went wrong. Please try again.');
  }
}

/**
 * Add resource to favorites
 */
async function addToFavorites(ctx) {
  try {
    await ctx.answerCbQuery();
    
    const resourceId = ctx.callbackQuery.data.replace('fav_add_', '');
    const oduserId = ctx.from.id.toString();
    
    // Check if already favorited
    const existing = await Favorite.findOne({ oduserId, resourceId });
    if (existing) {
      return ctx.answerCbQuery('⭐ Already in favorites!', { show_alert: true });
    }
    
    // Add to favorites
    await Favorite.create({ oduserId, resourceId });
    
    await ctx.answerCbQuery('⭐ Added to favorites!', { show_alert: true });
    
    console.log(`⭐ User ${oduserId} added resource ${resourceId} to favorites`);
    
  } catch (error) {
    console.error('❌ Add favorite error:', error.message);
    await ctx.answerCbQuery('Failed to add to favorites');
  }
}

/**
 * Remove from favorites
 */
async function removeFromFavorites(ctx) {
  try {
    await ctx.answerCbQuery();
    
    const favId = ctx.callbackQuery.data.replace('fav_remove_', '');
    
    await Favorite.findByIdAndDelete(favId);
    
    // Refresh the list
    await showFavorites(ctx, 0);
    
    console.log(`❌ Favorite ${favId} removed`);
    
  } catch (error) {
    console.error('❌ Remove favorite error:', error.message);
    await ctx.answerCbQuery('Failed to remove');
  }
}

/**
 * Handle favorites pagination
 */
async function handleFavoritesPage(ctx) {
  try {
    await ctx.answerCbQuery();
    const page = parseInt(ctx.callbackQuery.data.replace('fav_page_', ''));
    await showFavorites(ctx, page);
  } catch (error) {
    console.error('❌ Favorites page error:', error.message);
  }
}

module.exports = {
  handleFavorites,
  showFavorites,
  addToFavorites,
  removeFromFavorites,
  handleFavoritesPage
};
