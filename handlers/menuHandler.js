/**
 * ================================
 * Menu Handler (Day 8 Enhanced)
 * ================================
 * 
 * Unified home menu with all features.
 * Common navigation buttons for all screens.
 */

const { Markup } = require('telegraf');
const College = require('../db/schemas/College');
const Department = require('../db/schemas/Department');

/**
 * Get common navigation buttons
 */
function getCommonButtons() {
  return [
    [
      Markup.button.callback('🏠 Home', 'go_home'),
      Markup.button.callback('🔍 Search', 'go_search')
    ],
    [
      Markup.button.callback('⭐ Favorites', 'go_favorites'),
      Markup.button.callback('🕘 History', 'go_history')
    ]
  ];
}

/**
 * Get the main menu keyboard (persistent)
 */
function getMainMenuKeyboard() {
  return Markup.keyboard([
    ['📚 Browse', '🔍 Search'],
    ['⭐ Favorites', '🕘 History'],
    ['❓ Help']
  ]).resize();
}

/**
 * Show unified home menu
 */
async function showHomeMenu(ctx) {
  const buttons = [
    [Markup.button.callback('📚 Browse Colleges', 'browse_colleges')],
    [Markup.button.callback('🔍 Search Resources', 'go_search')],
    [
      Markup.button.callback('⭐ Favorites', 'go_favorites'),
      Markup.button.callback('🕘 History', 'go_history')
    ],
    [Markup.button.callback('📋 All Departments', 'show_all_depts')],
    [Markup.button.callback('📊 Statistics', 'go_stats')],
    [Markup.button.callback('❓ Help', 'show_help')]
  ];
  
  const message = 
    '🎓 *HUMSJ Academic Library Bot*\n\n' +
    '📚 Your one-stop destination for academic resources.\n\n' +
    '*Select an option:*';
  
  if (ctx.callbackQuery) {
    await ctx.editMessageText(message, {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard(buttons)
    });
  } else {
    await ctx.reply(message, {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard(buttons),
      ...getMainMenuKeyboard()
    });
  }
}

/**
 * Handle go_home callback
 */
async function handleGoHome(ctx) {
  try {
    await ctx.answerCbQuery();
    await showHomeMenu(ctx);
  } catch (error) {
    console.error('❌ Go home error:', error.message);
  }
}

/**
 * Handle go_search callback
 */
async function handleGoSearch(ctx) {
  try {
    await ctx.answerCbQuery();
    await ctx.editMessageText(
      '🔍 *Search Resources*\n\n' +
      'Type `/search` followed by your keyword:\n\n' +
      '*Examples:*\n' +
      '• `/search calculus`\n' +
      '• `/search biology`\n' +
      '• `/search chapter 1`\n' +
      '• `/search exam`',
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard(getCommonButtons())
      }
    );
  } catch (error) {
    console.error('❌ Go search error:', error.message);
  }
}

/**
 * Handle "Browse Colleges" button
 */
async function handleBrowseColleges(ctx) {
  try {
    if (ctx.callbackQuery) await ctx.answerCbQuery();
    
    const colleges = await College.find({}).sort({ name: 1 });
    
    if (!colleges || colleges.length === 0) {
      return ctx.reply('📭 No colleges found.');
    }
    
    const buttons = colleges.map(college => [
      Markup.button.callback(`🏛️ ${college.name}`, `college_${college._id}`)
    ]);
    
    // Add common navigation
    buttons.push([
      Markup.button.callback('🏠 Home', 'go_home'),
      Markup.button.callback('🔍 Search', 'go_search')
    ]);
    
    const message = '🏛️ *Select a College*\n\nChoose a college to browse:';
    
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
    console.error('❌ Browse colleges error:', error.message);
    await ctx.reply('⚠️ Something went wrong. Please try again.');
  }
}

/**
 * Handle "All Departments" button
 */
async function handleAllDepartments(ctx) {
  try {
    if (ctx.callbackQuery) await ctx.answerCbQuery();
    
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
    
    // Split if too long
    if (message.length > 4000) {
      const parts = splitMessage(message, 4000);
      for (let i = 0; i < parts.length; i++) {
        if (i === parts.length - 1) {
          await ctx.reply(parts[i], {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard(getCommonButtons())
          });
        } else {
          await ctx.reply(parts[i], { parse_mode: 'Markdown' });
        }
      }
    } else {
      if (ctx.callbackQuery) {
        await ctx.editMessageText(message, {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard(getCommonButtons())
        });
      } else {
        await ctx.reply(message, {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard(getCommonButtons())
        });
      }
    }
    
  } catch (error) {
    console.error('❌ All departments error:', error.message);
    await ctx.reply('⚠️ Something went wrong. Please try again.');
  }
}

/**
 * Handle "Help" button
 */
async function handleHelp(ctx) {
  try {
    if (ctx.callbackQuery) await ctx.answerCbQuery();
    
    const message = 
      '❓ *Help - HUMSJ Academic Library*\n\n' +
      '*Commands:*\n' +
      '• `/start` - Home menu\n' +
      '• `/browse` - Browse colleges\n' +
      '• `/search <keyword>` - Search resources\n' +
      '• `/favorites` - Your saved items\n' +
      '• `/history` - Browsing history\n\n' +
      '*How to use:*\n' +
      '1. Tap "📚 Browse" to navigate\n' +
      '2. Select College → Department → Year → Semester\n' +
      '3. Choose a course and chapter\n' +
      '4. Download your PDF!\n\n' +
      '*Tips:*\n' +
      '• Use ⭐ to save favorites\n' +
      '• Use 🔍 to search directly\n' +
      '• Use 🕘 to see recent items';
    
    if (ctx.callbackQuery) {
      await ctx.editMessageText(message, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard(getCommonButtons())
      });
    } else {
      await ctx.reply(message, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard(getCommonButtons())
      });
    }
    
  } catch (error) {
    console.error('❌ Help error:', error.message);
  }
}

/**
 * Split long message
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
  
  if (current) parts.push(current);
  return parts;
}

module.exports = {
  getCommonButtons,
  getMainMenuKeyboard,
  showHomeMenu,
  handleGoHome,
  handleGoSearch,
  handleBrowseColleges,
  handleAllDepartments,
  handleHelp
};
