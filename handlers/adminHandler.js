/**
 * ================================
 * Admin Handler (Day 11 Enhanced)
 * ================================
 * 
 * Admin commands with polished UI.
 */

const { Markup } = require('telegraf');
const User = require('../db/schemas/User');
const DownloadStat = require('../db/schemas/DownloadStat');
const Resource = require('../db/schemas/Resource');
const Course = require('../db/schemas/Course');
const Department = require('../db/schemas/Department');
const College = require('../db/schemas/College');
const History = require('../db/schemas/History');
const { log } = require('../utils/logger');
const {
  EMOJI,
  BRAND,
  ERRORS,
  NAV,
  showTyping,
  safeAnswerCallback
} = require('../utils/branding');

const ADMIN_IDS = process.env.ADMIN_IDS ? process.env.ADMIN_IDS.split(',').map(id => id.trim()) : [];

/**
 * Check if user is admin
 */
function isAdmin(userId) {
  return ADMIN_IDS.includes(userId.toString());
}

/**
 * Handle /broadcast command
 */
async function handleBroadcast(ctx) {
  try {
    const userId = ctx.from.id.toString();
    
    if (!isAdmin(userId)) {
      return ctx.reply(`${EMOJI.error} Admin access required.`);
    }
    
    const message = ctx.message.text.replace('/broadcast', '').trim();
    
    if (!message) {
      return ctx.reply(
        `📢 *Broadcast Usage:*\n\n` +
        `\`/broadcast Your message here\`\n\n` +
        `This will send the message to all registered users.`,
        { parse_mode: 'Markdown' }
      );
    }
    
    await ctx.reply(`${EMOJI.loading} Starting broadcast...`);
    
    const users = await User.find({}, 'telegramId');
    let sent = 0;
    let failed = 0;
    
    const broadcastMessage = 
      `📢 *Announcement from ${BRAND.name}*\n\n` +
      `${message}\n\n` +
      `_— ${BRAND.shortName} Bot_`;
    
    for (const user of users) {
      try {
        await ctx.telegram.sendMessage(user.telegramId, broadcastMessage, {
          parse_mode: 'Markdown'
        });
        sent++;
        
        if (sent % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        failed++;
        log.warn(`Broadcast failed for user ${user.telegramId}`, { error: error.message });
      }
    }
    
    await ctx.reply(
      `${EMOJI.success} *Broadcast Complete*\n\n` +
      `📤 Sent: ${sent}\n` +
      `${EMOJI.error} Failed: ${failed}\n` +
      `👥 Total: ${users.length}`,
      { parse_mode: 'Markdown' }
    );
    
    log.info('Broadcast completed', { sent, failed, total: users.length, adminId: userId });
    
  } catch (error) {
    log.error('Broadcast error', { error: error.message });
    await ctx.reply(ERRORS.general);
  }
}

/**
 * Handle /analytics command
 */
async function handleAnalytics(ctx) {
  try {
    const userId = ctx.from.id.toString();
    
    if (!isAdmin(userId)) {
      return ctx.reply(`${EMOJI.error} Admin access required.`);
    }
    
    await showTyping(ctx);
    
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    // Active users today
    const activeToday = await DownloadStat.distinct('oduserId', {
      timestamp: { $gte: todayStart }
    });
    
    // Resources accessed today
    const resourcesToday = await DownloadStat.distinct('resourceId', {
      timestamp: { $gte: todayStart }
    });
    
    // Total downloads
    const totalDownloads = await DownloadStat.countDocuments({ action: 'download' });
    const todayDownloads = await DownloadStat.countDocuments({
      action: 'download',
      timestamp: { $gte: todayStart }
    });
    
    // Most used college
    const collegeStats = await History.aggregate([
      { $match: { timestamp: { $gte: todayStart } } },
      { $group: { _id: '$collegeId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 }
    ]);
    
    let topCollege = 'N/A';
    if (collegeStats.length > 0 && collegeStats[0]._id) {
      const college = await College.findById(collegeStats[0]._id);
      topCollege = college ? college.name : 'N/A';
    }
    
    // Most used department
    const deptStats = await History.aggregate([
      { $match: { timestamp: { $gte: todayStart } } },
      { $group: { _id: '$departmentId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 }
    ]);
    
    let topDept = 'N/A';
    if (deptStats.length > 0 && deptStats[0]._id) {
      const dept = await Department.findById(deptStats[0]._id);
      topDept = dept ? dept.name : 'N/A';
    }
    
    // Most used course
    const courseStats = await DownloadStat.aggregate([
      { $match: { timestamp: { $gte: todayStart } } },
      { $lookup: { from: 'resources', localField: 'resourceId', foreignField: '_id', as: 'resource' } },
      { $unwind: '$resource' },
      { $group: { _id: '$resource.courseId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 }
    ]);
    
    let topCourse = 'N/A';
    if (courseStats.length > 0 && courseStats[0]._id) {
      const course = await Course.findById(courseStats[0]._id);
      topCourse = course ? `${course.courseCode} - ${course.name}` : 'N/A';
    }
    
    // Peak usage hours
    const hourlyStats = await DownloadStat.aggregate([
      { $match: { timestamp: { $gte: todayStart } } },
      { $group: { _id: { $hour: '$timestamp' }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 3 }
    ]);
    
    const peakHours = hourlyStats.map(h => `${h._id}:00`).join(', ') || 'N/A';
    
    // Total registered users
    const totalUsers = await User.countDocuments();
    
    const message = 
      `${EMOJI.stats} *${BRAND.shortName} Analytics*\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n\n` +
      
      `👥 *Users*\n` +
      `├ Active today: ${activeToday.length}\n` +
      `└ Total registered: ${totalUsers}\n\n` +
      
      `${EMOJI.download} *Downloads*\n` +
      `├ Today: ${todayDownloads}\n` +
      `└ All time: ${totalDownloads}\n\n` +
      
      `${EMOJI.resource} *Resources*\n` +
      `└ Accessed today: ${resourcesToday.length}\n\n` +
      
      `🏆 *Top Today*\n` +
      `├ College: ${topCollege}\n` +
      `├ Department: ${topDept}\n` +
      `└ Course: ${topCourse}\n\n` +
      
      `⏰ *Peak Hours*\n` +
      `└ ${peakHours}\n\n` +
      
      `_Updated: ${new Date().toLocaleString()}_`;
    
    await ctx.reply(message, {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('🔄 Refresh', 'analytics_refresh')],
        [Markup.button.callback(NAV.home, 'go_home')]
      ])
    });
    
  } catch (error) {
    log.error('Analytics error', { error: error.message });
    await ctx.reply(ERRORS.general);
  }
}

/**
 * Handle analytics refresh
 */
async function handleAnalyticsRefresh(ctx) {
  try {
    await safeAnswerCallback(ctx, '🔄 Refreshing...');
    await handleAnalytics(ctx);
  } catch (error) {
    log.error('Analytics refresh error', { error: error.message });
  }
}

module.exports = {
  handleBroadcast,
  handleAnalytics,
  handleAnalyticsRefresh,
  isAdmin,
  ADMIN_IDS
};
