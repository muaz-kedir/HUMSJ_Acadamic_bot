/**
 * ================================
 * Menu Handler (Day 11 Enhanced)
 * ================================
 * 
 * Polished home menu with HUMSJ branding.
 * Improved UX with loading states and consistent navigation.
 */

const { Markup } = require('telegraf');
const College = require('../db/schemas/College');
const Department = require('../db/schemas/Department');
const {
  BRAND,
  EMOJI,
  WELCOME_MESSAGE,
  HELP_MESSAGE,
  LOADING,
  ERRORS,
  EMPTY,
  NAV,
  HEADERS,
  showTyping,
  safeEditMessage,
  safeAnswerCallback
} = require('../utils/branding');

/**
 * Get common navigation buttons
 */
function getCommonButtons() {
  return [
    [
      Markup.button.callback(NAV.home, 'go_home'),
      Markup.button.callback(NAV.search, 'go_search')
    ],
    [
      Markup.button.callback(NAV.favorites, 'go_favorites'),
      Markup.button.callback(NAV.history, 'go_history')
    ]
  ];
}

/**
 * Get the main menu keyboard (persistent)
 */
function getMainMenuKeyboard() {
  return Markup.keyboard([
    [`${EMOJI.college} Browse`, `${EMOJI.search} Search`],
    [`${EMOJI.favorites} Favorites`, `${EMOJI.history} History`],
    [`${EMOJI.help} Help`]
  ]).resize();
}

/**
 * Show unified home menu with welcome message
 */
async function showHomeMenu(ctx) {
  const buttons = [
    [Markup.button.callback(`${EMOJI.college} Browse Colleges`, 'browse_colleges')],
    [Markup.button.callback(`${EMOJI.search} Search Resources`, 'go_search')],
    [
      Markup.button.callback(NAV.favorites, 'go_favorites'),
      Markup.button.callback(NAV.history, 'go_history')
    ],
    [Markup.button.callback(NAV.allDepts, 'show_all_depts')],
    [Markup.button.callback(NAV.stats, 'go_stats')],
    [Markup.button.callback(NAV.help, 'show_help')]
  ];
  
  if (ctx.callbackQuery) {
    await safeAnswerCallback(ctx);
    await safeEditMessage(ctx, WELCOME_MESSAGE, {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard(buttons)
    });
  } else {
    await ctx.reply(WELCOME_MESSAGE, {
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
    await safeAnswerCallback(ctx);
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
    await safeAnswerCallback(ctx);
    
    const message = `${EMOJI.search} *Search Resources*

Type \`/search\` followed by your keyword:

*Examples:*
${EMOJI.bullet} \`/search calculus\`
${EMOJI.bullet} \`/search biology\`
${EMOJI.bullet} \`/search chapter 1\`
${EMOJI.bullet} \`/search exam\`

${EMOJI.info} _Tip: Search works across all courses and chapters!_`;
    
    await safeEditMessage(ctx, message, {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard(getCommonButtons())
    });
  } catch (error) {
    console.error('❌ Go search error:', error.message);
  }
}

/**
 * Handle "Browse Colleges" button
 */
async function handleBrowseColleges(ctx) {
  try {
    if (ctx.callbackQuery) await safeAnswerCallback(ctx);
    
    // Show typing indicator
    await showTyping(ctx);
    
    const colleges = await College.find({}).sort({ name: 1 });
    
    if (!colleges || colleges.length === 0) {
      const buttons = [[Markup.button.callback(NAV.home, 'go_home')]];
      
      if (ctx.callbackQuery) {
        return safeEditMessage(ctx, EMPTY.colleges, {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard(buttons)
        });
      }
      return ctx.reply(EMPTY.colleges, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard(buttons)
      });
    }
    
    const buttons = colleges.map(college => [
      Markup.button.callback(`${EMOJI.college} ${college.name}`, `college_${college._id}`)
    ]);
    
    // Add navigation
    buttons.push([
      Markup.button.callback(NAV.home, 'go_home'),
      Markup.button.callback(NAV.search, 'go_search')
    ]);
    
    if (ctx.callbackQuery) {
      await safeEditMessage(ctx, HEADERS.selectCollege, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard(buttons)
      });
    } else {
      await ctx.reply(HEADERS.selectCollege, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard(buttons)
      });
    }
    
  } catch (error) {
    console.error('❌ Browse colleges error:', error.message);
    await ctx.reply(ERRORS.general);
  }
}

/**
 * Handle "All Departments" button
 */
async function handleAllDepartments(ctx) {
  try {
    if (ctx.callbackQuery) await safeAnswerCallback(ctx);
    
    // Show typing indicator
    await showTyping(ctx);
    
    const colleges = await College.find({}).sort({ name: 1 });
    
    let message = `📋 *All Colleges & Departments*\n\n`;
    
    for (const college of colleges) {
      const departments = await Department.find({ collegeId: college._id }).sort({ name: 1 });
      
      message += `${EMOJI.college} *${college.name}*\n`;
      
      if (departments.length === 0) {
        message += `   _No departments yet_\n`;
      } else {
        departments.forEach(dept => {
          message += `   ${EMOJI.bullet} ${dept.name}\n`;
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
        await safeEditMessage(ctx, message, {
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
    await ctx.reply(ERRORS.general);
  }
}

/**
 * Handle "Help" button
 */
async function handleHelp(ctx) {
  try {
    if (ctx.callbackQuery) await safeAnswerCallback(ctx);
    
    if (ctx.callbackQuery) {
      await safeEditMessage(ctx, HELP_MESSAGE, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard(getCommonButtons())
      });
    } else {
      await ctx.reply(HELP_MESSAGE, {
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
