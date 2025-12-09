/**
 * ================================
 * Stats Handler (Admin)
 * ================================
 * 
 * Download statistics and analytics.
 */

const { Markup } = require('telegraf');
const DownloadStat = require('../db/schemas/DownloadStat');
const Resource = require('../db/schemas/Resource');

// Admin user IDs (add your Telegram ID here)
// To find your ID, message @userinfobot on Telegram
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
    const oduserId = ctx.from.id.toString();
    
    // For now, allow all users to see basic stats
    // Uncomment below to restrict to admins only
    // if (!isAdmin(oduserId)) {
    //   return ctx.reply('⛔ Admin access required.');
    // }
    
    await ctx.reply('📊 Loading statistics...');
    
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
    
    // Get resource details
    let topResourcesText = '';
    for (const item of topResources) {
      const resource = await Resource.findById(item._id);
      if (resource) {
        topResourcesText += `• ${resource.title} (${item.count} downloads)\n`;
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
      dailyText += `• ${d._id}: ${d.count} downloads\n`;
    });
    
    const message = 
      `📊 *HUMSJ Bot Statistics*\n\n` +
      `📥 *Total Downloads:* ${totalDownloads}\n` +
      `👁️ *Total Previews:* ${totalPreviews}\n\n` +
      `🏆 *Top Resources:*\n${topResourcesText || 'No data yet'}\n` +
      `👥 *Most Active Users:*\n${topUsersText || 'No data yet'}\n` +
      `📅 *Last 7 Days:*\n${dailyText || 'No data yet'}`;
    
    await ctx.reply(message, {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('🔄 Refresh', 'stats_refresh')],
        [Markup.button.callback('🏠 Home', 'go_home')]
      ])
    });
    
  } catch (error) {
    console.error('❌ Stats error:', error.message);
    await ctx.reply('⚠️ Failed to load statistics.');
  }
}

/**
 * Handle stats refresh
 */
async function handleStatsRefresh(ctx) {
  try {
    await ctx.answerCbQuery('🔄 Refreshing...');
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
