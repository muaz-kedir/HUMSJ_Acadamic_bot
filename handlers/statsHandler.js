/**
 * ================================
 * Stats Handler (Day 11 Enhanced)
 * ================================
 * 
 * Download statistics with polished UI.
 */

const { Markup } = require('telegraf');
const DownloadStat = require('../db/schemas/DownloadStat');
const Resource = require('../db/schemas/Resource');
const {
  EMOJI,
  ERRORS,
  NAV,
  LOADING,
  showTyping,
  safeAnswerCallback
} = require('../utils/branding');

const ADMIN_IDS = process.env.ADMIN_IDS ? process.env.ADMIN_IDS.split(',') : [];

/**
 * Check if user is admin
 */
function isAdmin(userId) {
  return ADMIN_IDS.includes(userId.toString());
}

/**
 * Handle /stats command
 */
async function handleStats(ctx) {
  try {
    // Show typing indicator
    await showTyping(ctx);
    
    // Get total downloads
    const totalDownloads = await DownloadStat.countDocuments({ action: 'download' });
    const totalPreviews = await DownloadStat.countDocuments({ action: 'preview' });
    
    // Get most downloaded resources
    const topResources = await DownloadStat.aggregate([
      { $match: { action: 'download' } },
      { $group: { _id: '$resourceId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    
    let topResourcesText = '';
    for (const item of topResources) {
      const resource = await Resource.findById(item._id);
      if (resource) {
        topResourcesText += `${EMOJI.bullet} ${resource.title} (${item.count} downloads)\n`;
      }
    }
    
    // Get most active users
    const topUsers = await DownloadStat.aggregate([
      { $group: { _id: '$oduserId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    
    let topUsersText = '';
    topUsers.forEach((u, i) => {
      topUsersText += `${i + 1}. User ${u._id.substring(0, 6)}... (${u.count} actions)\n`;
    });
    
    // Get downloads by day (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const dailyStats = await DownloadStat.aggregate([
      { $match: { timestamp: { $gte: sevenDaysAgo }, action: 'download' } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } }
    ]);
    
    let dailyText = '';
    dailyStats.forEach(d => {
      dailyText += `${EMOJI.bullet} ${d._id}: ${d.count} downloads\n`;
    });
    
    const message = 
      `${EMOJI.stats} *HUMSJ Library Statistics*\n\n` +
      `${EMOJI.download} *Total Downloads:* ${totalDownloads}\n` +
      `👁️ *Total Previews:* ${totalPreviews}\n\n` +
      `🏆 *Top Resources:*\n${topResourcesText || '_No data yet_'}\n` +
      `👥 *Most Active Users:*\n${topUsersText || '_No data yet_'}\n` +
      `${EMOJI.year} *Last 7 Days:*\n${dailyText || '_No data yet_'}`;
    
    const buttons = [
      [Markup.button.callback('🔄 Refresh', 'stats_refresh')],
      [
        Markup.button.callback(NAV.home, 'go_home'),
        Markup.button.callback(NAV.favorites, 'go_favorites')
      ]
    ];
    
    await ctx.reply(message, {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard(buttons)
    });
    
  } catch (error) {
    console.error('❌ Stats error:', error.message);
    await ctx.reply(ERRORS.general);
  }
}

/**
 * Handle stats refresh
 */
async function handleStatsRefresh(ctx) {
  try {
    await safeAnswerCallback(ctx, '🔄 Refreshing...');
    await handleStats(ctx);
  } catch (error) {
    console.error('❌ Stats refresh error:', error.message);
  }
}

module.exports = {
  handleStats,
  handleStatsRefresh,
  isAdmin,
  ADMIN_IDS
};
