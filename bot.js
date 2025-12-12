/**
 * ================================
 * HUMSJ Academic Library Bot
 * Day 10: Production Ready
 * ================================
 */

require('dotenv').config();

const { Telegraf } = require('telegraf');
const connectDB = require('./db/mongoose');
const { log } = require('./utils/logger');
const { startHealthServer } = require('./server');
const { initScheduler } = require('./utils/scheduler');
const { errorMiddleware, setupGlobalErrorHandlers } = require('./utils/errorHandler');

// Import handlers
const handleTestCommand = require('./commands/test');
const {
  showHomeMenu,
  handleGoHome,
  handleGoSearch,
  handleBrowseColleges,
  handleAllDepartments,
  handleHelp
} = require('./handlers/menuHandler');
const { handleBrowse } = require('./handlers/collegeHandler');
const { handleCollegeSelect } = require('./handlers/departmentHandler');
const { handleDepartmentSelect } = require('./handlers/yearHandler');
const { handleYearSelect } = require('./handlers/semesterHandler');
const { handleSemesterSelect } = require('./handlers/courseHandler');
const { handleCourseSelect } = require('./handlers/chapterHandler');
const { handleChapterSelect } = require('./handlers/resourceHandler');
const {
  handleSearch,
  handleSearchPagination,
  handleSearchFilter,
  handleSearchChapterSelect,
  handleBackToSearch
} = require('./handlers/searchHandler');
const {
  handleFavorites,
  addToFavorites,
  removeFromFavorites,
  handleFavoritesPage
} = require('./handlers/favoritesHandler');
const {
  handleHistory,
  handleHistoryPage,
  clearHistory
} = require('./handlers/historyHandler');
const {
  showResourcePreview,
  handlePdfPreview,
  handlePdfDownload,
  handleZipDownload,
  handleContinueReading
} = require('./handlers/pdfHandler');
const { handleStats, handleStatsRefresh } = require('./handlers/statsHandler');
const {
  handleBroadcast,
  handleAnalytics,
  handleAnalyticsRefresh
} = require('./handlers/adminHandler');
const { handleNotifyInterest } = require('./handlers/interestHandler');
const {
  handleAdminPanel,
  handleUploadStart,
  handleUploadCollegeSelect,
  handleUploadDeptSelect,
  handleUploadYearSelect,
  handleUploadSemSelect,
  handleUploadCourseSelect,
  handleUploadTypeSelect,
  handleUploadNewCourse,
  handleUploadTextInput,
  handleFileUpload,
  handleAddCourseStart,
  handleAddCourseCollegeSelect,
  handleAddCourseDeptSelect,
  handleAddCourseYearSelect,
  handleAddCourseSemSelect,
  handleManageCourses,
  handleListCourses,
  handleAdminCancel,
  handleAdminPanelCallback
} = require('./handlers/uploadHandler');
const {
  handleAISummary,
  handleAISummaryLong,
  handleAIFlashcards,
  handleFlashcardPage,
  handleAIQuiz,
  handleAIMindMap
} = require('./handlers/aiHandler');
const { rateLimitMiddleware } = require('./utils/rateLimiter');
const { clearSession } = require('./utils/sessionManager');
const { isAIAvailable } = require('./utils/aiService');

// ================================
// Environment Validation
// ================================
if (!process.env.BOT_TOKEN) {
  log.error('BOT_TOKEN is not defined');
  process.exit(1);
}

// ================================
// Bot Initialization
// ================================
const bot = new Telegraf(process.env.BOT_TOKEN);

// Setup global error handlers
setupGlobalErrorHandlers(bot);

// Apply middlewares
bot.use(errorMiddleware(bot));
bot.use(rateLimitMiddleware());

// Set bot commands
bot.telegram.setMyCommands([
  { command: 'start', description: '🏠 Home menu' },
  { command: 'browse', description: '📚 Browse colleges' },
  { command: 'search', description: '🔍 Search resources' },
  { command: 'favorites', description: '⭐ Your favorites' },
  { command: 'history', description: '🕘 Browsing history' },
  { command: 'stats', description: '📊 Statistics' },
  { command: 'admin', description: '🔧 Admin panel' },
  { command: 'status', description: '📡 Bot status' },
  { command: 'help', description: '❓ Get help' }
]);

// ================================
// Command Handlers
// ================================

bot.start((ctx) => {
  clearSession(ctx.chat.id);
  showHomeMenu(ctx);
  log.userAction(ctx.from.id, 'start', { username: ctx.from.username });
});

bot.command('browse', handleBrowse);
bot.command('search', handleSearch);
bot.command('favorites', handleFavorites);
bot.command('history', handleHistory);
bot.command('stats', handleStats);
bot.command('help', handleHelp);
bot.command('testdb', handleTestCommand);

// Admin commands
bot.command('admin', handleAdminPanel);
bot.command('broadcast', handleBroadcast);
bot.command('analytics', handleAnalytics);

// Status command
bot.command('status', async (ctx) => {
  const uptime = process.uptime();
  const hours = Math.floor(uptime / 3600);
  const mins = Math.floor((uptime % 3600) / 60);
  
  const User = require('./db/schemas/User');
  const DownloadStat = require('./db/schemas/DownloadStat');
  
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  
  const usersToday = await DownloadStat.distinct('oduserId', { timestamp: { $gte: todayStart } });
  const downloadsToday = await DownloadStat.countDocuments({ action: 'download', timestamp: { $gte: todayStart } });
  
  await ctx.reply(
    `🔧 *Bot Status*\n\n` +
    `✅ Status: Online\n` +
    `🧠 AI Engine: ${isAIAvailable() ? 'Groq/Llama-3 ✅' : 'Not configured ❌'}\n` +
    `⏱️ Uptime: ${hours}h ${mins}m\n` +
    `👥 Users Today: ${usersToday.length}\n` +
    `📥 Downloads Today: ${downloadsToday}\n` +
    `🌍 Environment: ${process.env.NODE_ENV || 'development'}`,
    { parse_mode: 'Markdown' }
  );
});

// ================================
// Keyboard Button Handlers
// ================================

bot.hears('🏛️ Browse', handleBrowseColleges);
bot.hears('📚 Browse', handleBrowseColleges); // Legacy support
bot.hears('🔍 Search', handleGoSearch);
bot.hears('⭐ Favorites', handleFavorites);
bot.hears('🕘 History', handleHistory);
bot.hears('❓ Help', handleHelp);

// ================================
// Navigation Callbacks
// ================================

bot.action('go_home', handleGoHome);
bot.action('go_search', handleGoSearch);
bot.action('go_favorites', async (ctx) => { await ctx.answerCbQuery(); await handleFavorites(ctx); });
bot.action('go_history', async (ctx) => { await ctx.answerCbQuery(); await handleHistory(ctx); });
bot.action('browse_colleges', handleBrowseColleges);
bot.action('show_all_depts', handleAllDepartments);
bot.action('show_help', handleHelp);
bot.action('go_stats', async (ctx) => { await ctx.answerCbQuery(); await handleStats(ctx); });
bot.action('noop', (ctx) => ctx.answerCbQuery());
bot.action('start_over', (ctx) => { ctx.answerCbQuery(); clearSession(ctx.chat.id); showHomeMenu(ctx); });

// ================================
// Favorites Callbacks
// ================================

bot.action(/^fav_add_/, addToFavorites);
bot.action(/^fav_remove_/, removeFromFavorites);
bot.action(/^fav_page_/, handleFavoritesPage);

// ================================
// History Callbacks
// ================================

bot.action(/^hist_page_/, handleHistoryPage);
bot.action('hist_clear', clearHistory);

// ================================
// PDF Callbacks
// ================================

bot.action(/^pdf_preview_/, handlePdfPreview);
bot.action(/^pdf_download_/, handlePdfDownload);
bot.action(/^pdf_zip_/, handleZipDownload);
bot.action(/^pdf_continue_/, handleContinueReading);

// ================================
// Stats & Analytics Callbacks
// ================================

bot.action('stats_refresh', handleStatsRefresh);
bot.action('analytics_refresh', handleAnalyticsRefresh);

// ================================
// Interest/Notification Callbacks
// ================================

bot.action(/^notify_interest_/, handleNotifyInterest);

// ================================
// AI Study Tools Callbacks
// ================================

bot.action(/^ai_summary_long_/, handleAISummaryLong);
bot.action(/^ai_summary_/, handleAISummary);
bot.action(/^ai_flashcards_/, handleAIFlashcards);
bot.action(/^fc_page_/, handleFlashcardPage);
bot.action(/^ai_quiz_/, handleAIQuiz);
bot.action(/^ai_mindmap_/, handleAIMindMap);

// ================================
// Admin Upload Callbacks
// ================================

bot.action('admin_panel', handleAdminPanelCallback);
bot.action('admin_upload_start', handleUploadStart);
bot.action('admin_add_course', handleAddCourseStart);
bot.action('admin_manage_courses', handleManageCourses);
bot.action('admin_list_courses', handleListCourses);
bot.action('admin_cancel', handleAdminCancel);
bot.action('admin_stats', async (ctx) => { await ctx.answerCbQuery(); await handleStats(ctx); });

// Upload flow callbacks
bot.action(/^upload_college_/, handleUploadCollegeSelect);
bot.action(/^upload_dept_/, handleUploadDeptSelect);
bot.action(/^upload_year_/, handleUploadYearSelect);
bot.action(/^upload_sem_/, handleUploadSemSelect);
bot.action(/^upload_course_/, handleUploadCourseSelect);
bot.action(/^upload_type_/, handleUploadTypeSelect);
bot.action('upload_new_course', handleUploadNewCourse);

// Add course flow callbacks
bot.action(/^addcourse_college_/, handleAddCourseCollegeSelect);
bot.action(/^addcourse_dept_/, handleAddCourseDeptSelect);
bot.action(/^addcourse_year_/, handleAddCourseYearSelect);
bot.action(/^addcourse_sem_/, handleAddCourseSemSelect);

// ================================
// Search Callbacks
// ================================

bot.action(/^search_page_/, handleSearchPagination);
bot.action(/^search_filter_/, handleSearchFilter);
bot.action('back_search', handleBackToSearch);

// ================================
// Browse Navigation Callbacks
// ================================

bot.action(/^college_(.+)$/, handleCollegeSelect);
bot.action(/^department_(.+)$/, handleDepartmentSelect);
bot.action(/^year_(\d+)$/, handleYearSelect);
bot.action(/^semester_(\d+)$/, handleSemesterSelect);
bot.action(/^course_(.+)$/, handleCourseSelect);
bot.action(/^chapter_.+_.+$/, handleSearchChapterSelect);
bot.action(/^chapter_[^_]+$/, handleChapterSelect);

// Resource selection - show preview instead of direct download
bot.action(/^resource_(.+)$/, async (ctx) => {
  await ctx.answerCbQuery();
  const resourceId = ctx.callbackQuery.data.replace('resource_', '');
  await showResourcePreview(ctx, resourceId);
});

bot.action('back_colleges', handleBrowse);

// ================================
// Text Message Handler
// ================================

bot.on('text', async (ctx) => {
  const text = ctx.message.text;
  if (text.startsWith('/')) return;
  
  const menuButtons = ['📚 Browse', '🔍 Search', '⭐ Favorites', '🕘 History', '❓ Help', '🏛️ Browse'];
  if (menuButtons.includes(text)) return;
  
  // Check if this is part of admin upload flow
  const handled = await handleUploadTextInput(ctx);
  if (handled) return;
  
  if (text.length >= 3) {
    ctx.reply(
      `💡 Did you mean to search?\n\nType: \`/search ${text}\``,
      { parse_mode: 'Markdown' }
    );
  }
});

// ================================
// Document Handler (File Uploads)
// ================================

bot.on('document', async (ctx) => {
  // Check if this is part of admin upload flow
  const handled = await handleFileUpload(ctx);
  if (!handled) {
    ctx.reply('📄 To upload a resource, use /admin and follow the upload flow.');
  }
});

// ================================
// Error Handling
// ================================

bot.catch((err, ctx) => {
  log.botError(err, { updateType: ctx.updateType, userId: ctx.from?.id });
  ctx.reply('⚠️ Something went wrong. Please try again.').catch(() => {});
});

// ================================
// Bot Launch
// ================================

async function startBot() {
  try {
    log.info('Starting HUMSJ Academic Library Bot...');
    
    // Connect to database
    log.info('Connecting to MongoDB...');
    await connectDB();
    
    // Start health check server
    if (process.env.NODE_ENV === 'production') {
      startHealthServer();
    }
    
    // Initialize scheduler for backups and cleanup
    initScheduler();
    
    // Launch bot
    log.info('Launching Telegram bot...');
    
    await bot.launch({ dropPendingUpdates: true });
    
    log.info('🟢 HUMSJ Library Bot is running');
    log.info('📚 Features: Browse, Search, Favorites, History, Stats, Analytics');
    log.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    
  } catch (error) {
    log.error('Failed to start bot', { error: error.message });
    process.exit(1);
  }
}

// Graceful shutdown
process.once('SIGINT', () => {
  log.info('Received SIGINT, shutting down...');
  bot.stop('SIGINT');
});

process.once('SIGTERM', () => {
  log.info('Received SIGTERM, shutting down...');
  bot.stop('SIGTERM');
});

// Export bot for external use
module.exports = { bot };

startBot();
