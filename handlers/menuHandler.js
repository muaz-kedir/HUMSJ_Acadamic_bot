/**
 * ================================
 * Menu Handler
 * ================================
 * 
 * Handles the main menu with keyboard buttons.
 * Provides quick access to all colleges and features.
 */

const { Markup } = require('telegraf');
const College = require('../db/schemas/College');
const Department = require('../db/schemas/Department');

/**
 * Get the main menu keyboard
 * @returns {Object} Telegram keyboard markup
 */
function getMainMenuKeyboard() {
  return Markup.keyboard([
    ['📚 Browse Colleges', '🔍 Search'],
    ['📋 All Departments', '❓ Help']
  ]).resize();
}

/**
 * Handle main menu display
 * @param {Object} ctx - Telegraf context
 */
async function showMainMenu(ctx) {
  await ctx.reply(
    '📚 *HUMSJ Academic Library*\n\n' +
    'Choose an option from the menu below:',
    {
      parse_mode: 'Markdown',
      ...getMainMenuKeyboard()
    }
  );
}

/**
 * Handle "Browse Colleges" button
 * @param {Object} ctx - Telegraf context
 */
async function handleBrowseColleges(ctx) {
  try {
    const colleges = await College.find({}).sort({ name: 1 });
    
    if (!colleges || colleges.length === 0) {
      return ctx.reply('📭 No colleges found.');
    }
    
    // Build inline keyboard
    const buttons = colleges.map(college => [
      Markup.button.callback(`🏛️ ${college.name}`, `college_${college._id}`)
    ]);
    
    await ctx.reply(
      '🏛️ *Select a College*\n\n' +
      'Choose a college to browse departments:',
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard(buttons)
      }
    );
    
  } catch (error) {
    console.error('❌ Browse colleges error:', error.message);
    await ctx.reply('❌ An error occurred. Please try again.');
  }
}

/**
 * Handle "All Departments" button - Show all colleges with their departments
 * @param {Object} ctx - Telegraf context
 */
async function handleAllDepartments(ctx) {
  try {
    const colleges = await College.find({}).sort({ name: 1 });
    
    let message = '📋 *All Colleges & Departments*\n\n';
    
    for (const college of colleges) {
      const departments = await Department.find({ collegeId: college._id }).sort({ name: 1 });
      
      message += `🏛️ *${college.name}*\n`;
      
      if (departments.length === 0) {
        message += '   _No departments_\n';
      } else {
        departments.forEach(dept => {
          message += `   • ${dept.name}\n`;
        });
      }
      message += '\n';
    }
    
    message += '_Use /browse to navigate or /search to find resources_';
    
    // Split message if too long
    if (message.length > 4000) {
      const parts = splitMessage(message, 4000);
      for (const part of parts) {
        await ctx.reply(part, { parse_mode: 'Markdown' });
      }
    } else {
      await ctx.reply(message, { parse_mode: 'Markdown' });
    }
    
  } catch (error) {
    console.error('❌ All departments error:', error.message);
    await ctx.reply('❌ An error occurred. Please try again.');
  }
}

/**
 * Handle "Search" button
 * @param {Object} ctx - Telegraf context
 */
async function handleSearchButton(ctx) {
  await ctx.reply(
    '🔍 *Global Search*\n\n' +
    'Type `/search` followed by your keyword:\n\n' +
    '*Examples:*\n' +
    '• `/search calculus`\n' +
    '• `/search biology`\n' +
    '• `/search accounting`\n' +
    '• `/search psychology`',
    { parse_mode: 'Markdown' }
  );
}

/**
 * Handle "Help" button
 * @param {Object} ctx - Telegraf context
 */
async function handleHelp(ctx) {
  await ctx.reply(
    '❓ *Help - HUMSJ Academic Library Bot*\n\n' +
    '*Commands:*\n' +
    '• `/start` - Restart the bot\n' +
    '• `/browse` - Browse by college\n' +
    '• `/search <keyword>` - Search resources\n\n' +
    '*Menu Buttons:*\n' +
    '• 📚 Browse Colleges - Navigate colleges\n' +
    '• 🔍 Search - Search for resources\n' +
    '• 📋 All Departments - View all departments\n' +
    '• ❓ Help - Show this message\n\n' +
    '*How to use:*\n' +
    '1. Click "Browse Colleges" or use /browse\n' +
    '2. Select a college → department → year → semester\n' +
    '3. Choose a course and chapter\n' +
    '4. Download your PDF!\n\n' +
    '_Or use /search to find resources directly_',
    { parse_mode: 'Markdown' }
  );
}

/**
 * Split long message into parts
 * @param {string} message - Message to split
 * @param {number} maxLength - Maximum length per part
 * @returns {string[]} Array of message parts
 */
function splitMessage(message, maxLength) {
  const parts = [];
  let current = '';
  
  const lines = message.split('\n');
  for (const line of lines) {
    if ((current + line + '\n').length > maxLength) {
      parts.push(current);
      current = line + '\n';
    } else {
      current += line + '\n';
    }
  }
  
  if (current) {
    parts.push(current);
  }
  
  return parts;
}

module.exports = {
  getMainMenuKeyboard,
  showMainMenu,
  handleBrowseColleges,
  handleAllDepartments,
  handleSearchButton,
  handleHelp
};
