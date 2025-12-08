/**
 * ================================
 * HUMSJ Academic Library Bot
 * Main Entry Point
 * ================================
 * 
 * Day 5: Complete resource browsing & PDF delivery
 * College → Department → Year → Semester → Course → Chapter → Resource
 */

// Load environment variables first
require('dotenv').config();

// Import dependencies
const { Telegraf } = require('telegraf');
const connectDB = require('./db/mongoose');

// Import command handlers
const handleTestCommand = require('./commands/test');

// Import navigation handlers
const { handleBrowse } = require('./handlers/collegeHandler');
const { handleCollegeSelect } = require('./handlers/departmentHandler');
const { handleDepartmentSelect } = require('./handlers/yearHandler');
const { handleYearSelect } = require('./handlers/semesterHandler');
const { handleSemesterSelect } = require('./handlers/courseHandler');
const { handleCourseSelect } = require('./handlers/chapterHandler');
const { handleChapterSelect, handleResourceSelect } = require('./handlers/resourceHandler');
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
// Command Handlers
// ================================

// /start - Welcome message
bot.start((ctx) => {
  // Clear any existing session
  clearSession(ctx.chat.id);
  
  const welcomeMessage = `
Welcome to HUMSJ Academic Library Bot 📚

Your academic resources in one place.

📂 *Available Commands:*
/browse - Browse academic resources
/start - Show this message
/testdb - Test database connection

Use /browse to start exploring:
• 📄 PDF Documents
• 📊 Slides & Presentations
• 📖 Books
• 📝 Past Exams
  `;
  
  ctx.reply(welcomeMessage.trim(), { parse_mode: 'Markdown' });
  console.log(`👤 User started bot: ${ctx.from.username || ctx.from.id}`);
});

// /browse - Start academic navigation
bot.command('browse', handleBrowse);

// /testdb - Test database connection
bot.command('testdb', handleTestCommand);

// ================================
// Callback Query Handlers (Navigation)
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

// Chapter selection → Show resources
bot.action(/^chapter_(.+)$/, handleChapterSelect);

// Resource selection → Deliver file
bot.action(/^resource_(.+)$/, handleResourceSelect);

// Back to colleges
bot.action('back_colleges', handleBrowse);

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
    // Step 1: Connect to MongoDB first
    console.log('🔄 Connecting to MongoDB...');
    await connectDB();
    
    // Step 2: Launch the bot
    console.log('🔄 Launching Telegram bot...');
    
    bot.launch({
      dropPendingUpdates: true
    }).then(() => {
      console.log('🟢 HUMSJ Library Bot is running and database connected');
      console.log('📚 Ready to serve academic resources');
      console.log('🔗 Navigation: /browse to start');
    }).catch((err) => {
      console.error('❌ Bot launch error:', err.message);
    });
    
    // Don't await - let it run in background
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
