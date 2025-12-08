/**
 * ================================
 * HUMSJ Academic Library Bot
 * Main Entry Point
 * ================================
 * 
 * Features: Menu, Navigation, Search, PDF Delivery
 */

// Load environment variables first
require('dotenv').config();

// Import dependencies
const { Telegraf } = require('telegraf');
const connectDB = require('./db/mongoose');

// Import command handlers
const handleTestCommand = require('./commands/test');

// Import menu handlers
const {
  getMainMenuKeyboard,
  showMainMenu,
  handleBrowseColleges,
  handleAllDepartments,
  handleSearchButton,
  handleHelp
} = require('./handlers/menuHandler');

// Import navigation handlers
const { handleBrowse } = require('./handlers/collegeHandler');
const { handleCollegeSelect } = require('./handlers/departmentHandler');
const { handleDepartmentSelect } = require('./handlers/yearHandler');
const { handleYearSelect } = require('./handlers/semesterHandler');
const { handleSemesterSelect } = require('./handlers/courseHandler');
const { handleCourseSelect } = require('./handlers/chapterHandler');
const { handleChapterSelect, handleResourceSelect } = require('./handlers/resourceHandler');

// Import search handlers
const {
  handleSearch,
  handleSearchPagination,
  handleSearchFilter,
  handleSearchChapterSelect,
  handleBackToSearch
} = require('./handlers/searchHandler');

const { clearSession } = require('./utils/sessionManager');

// ================================
// Environment Validation
// ================================
if (!process.env.BOT_TOKEN) {
  console.error('❌ Error: BOT_TOKEN is not defined in .env file');
  process.exit(1);
}

// ================================
// Bot Initialization
// ================================
const bot = new Telegraf(process.env.BOT_TOKEN);

// ================================
// Set Bot Commands Menu (appears in Telegram)
// ================================
bot.telegram.setMyCommands([
  { command: 'start', description: '🏠 Start the bot' },
  { command: 'browse', description: '📚 Browse colleges' },
  { command: 'search', description: '🔍 Search resources' },
  { command: 'help', description: '❓ Get help' }
]);

// ================================
// Command Handlers
// ================================

// /start - Welcome message with menu
bot.start((ctx) => {
  clearSession(ctx.chat.id);
  
  const welcomeMessage = `
🎓 *Welcome to HUMSJ Academic Library Bot!*

Your one-stop destination for academic resources.

📚 *What you can do:*
• Browse colleges and departments
• Search for courses and materials
• Download PDFs, slides, and exams

Use the menu buttons below or type commands:
• \`/browse\` - Browse by college
• \`/search <keyword>\` - Search resources
• \`/help\` - Get help
  `;
  
  ctx.reply(welcomeMessage.trim(), {
    parse_mode: 'Markdown',
    ...getMainMenuKeyboard()
  });
  
  console.log(`👤 User started bot: ${ctx.from.username || ctx.from.id}`);
});

// /browse - Start academic navigation
bot.command('browse', handleBrowse);

// /search - Global search
bot.command('search', handleSearch);

// /help - Help message
bot.command('help', handleHelp);

// /testdb - Test database connection
bot.command('testdb', handleTestCommand);

// /menu - Show main menu
bot.command('menu', showMainMenu);

// ================================
// Keyboard Button Handlers (Text)
// ================================

// Handle "📚 Browse Colleges" button
bot.hears('📚 Browse Colleges', handleBrowseColleges);

// Handle "🔍 Search" button
bot.hears('🔍 Search', handleSearchButton);

// Handle "📋 All Departments" button
bot.hears('📋 All Departments', handleAllDepartments);

// Handle "❓ Help" button
bot.hears('❓ Help', handleHelp);

// ================================
// Search Callback Handlers
// ================================

// Search pagination
bot.action(/^search_page_/, handleSearchPagination);

// Search filter
bot.action(/^search_filter_/, handleSearchFilter);

// Back to search results
bot.action('back_search', handleBackToSearch);

// ================================
// Navigation Callback Handlers
// ================================

// College selection → Show departments
bot.action(/^college_(.+)$/, handleCollegeSelect);

// Department selection → Show years
bot.action(/^department_(.+)$/, handleDepartmentSelect);

// Year selection → Show semesters
bot.action(/^year_(\d+)$/, handleYearSelect);

// Semester selection → Show courses
bot.action(/^semester_(\d+)$/, handleSemesterSelect);

// Course selection → Show chapters
bot.action(/^course_(.+)$/, handleCourseSelect);

// Chapter selection (with courseId from search)
bot.action(/^chapter_.+_.+$/, handleSearchChapterSelect);

// Chapter selection (simple)
bot.action(/^chapter_[^_]+$/, handleChapterSelect);

// Resource selection → Deliver file
bot.action(/^resource_(.+)$/, handleResourceSelect);

// Back to colleges
bot.action('back_colleges', handleBrowse);

// ================================
// Text Message Handler
// ================================
bot.on('text', (ctx) => {
  const text = ctx.message.text;
  
  // Ignore commands and menu buttons
  if (text.startsWith('/')) return;
  if (['📚 Browse Colleges', '🔍 Search', '📋 All Departments', '❓ Help'].includes(text)) return;
  
  // Suggest search for other text
  if (text.length >= 3) {
    ctx.reply(
      `💡 Did you mean to search?\n\nType: \`/search ${text}\``,
      { parse_mode: 'Markdown' }
    );
  }
});

// ================================
// Error Handling
// ================================
bot.catch((err, ctx) => {
  console.error(`❌ Error for ${ctx.updateType}:`, err);
  ctx.reply('❌ An error occurred. Please try again later.');
});

// ================================
// Bot Launch Function
// ================================
async function startBot() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await connectDB();
    
    console.log('🔄 Launching Telegram bot...');
    
    bot.launch({
      dropPendingUpdates: true
    }).then(() => {
      console.log('🟢 HUMSJ Library Bot is running');
      console.log('📚 Menu: Browse Colleges | Search | All Departments | Help');
    }).catch((err) => {
      console.error('❌ Bot launch error:', err.message);
    });
    
    console.log('🟢 Bot initialization complete');
    
  } catch (error) {
    console.error('❌ Failed to start bot:', error);
    process.exit(1);
  }
}

// ================================
// Graceful Shutdown
// ================================
process.once('SIGINT', () => {
  console.log('\n🛑 Shutting down gracefully...');
  bot.stop('SIGINT');
});

process.once('SIGTERM', () => {
  console.log('\n🛑 Shutting down gracefully...');
  bot.stop('SIGTERM');
});

// Start the bot
startBot();
