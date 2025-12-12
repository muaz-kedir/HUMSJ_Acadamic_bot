/**
 * ================================
 * HUMSJ Branding & Messages
 * Day 11: UX Polish
 * ================================
 * 
 * Centralized branding, messages, and UI helpers
 * for consistent bot personality and appearance.
 */

// ================================
// Brand Identity
// ================================

const BRAND = {
  name: 'HUMSJ Academic Library',
  shortName: 'HUMSJ Library',
  tagline: 'Your Digital Academic Companion',
  emoji: '📚',
  supportContact: '@HUMSJ_Support'
};

// ================================
// Emoji Theme
// ================================

const EMOJI = {
  // Navigation
  home: '🏠',
  back: '🔙',
  next: '➡️',
  
  // Academic
  college: '🏛️',
  department: '📁',
  year: '📅',
  semester: '📘',
  course: '📖',
  chapter: '📑',
  resource: '📄',
  
  // Resource Types
  pdf: '📄',
  slide: '📊',
  book: '📖',
  exam: '📝',
  
  // Actions
  search: '🔍',
  favorites: '⭐',
  history: '🕘',
  download: '📥',
  stats: '📊',
  help: '❓',
  
  // Status
  loading: '⏳',
  success: '✅',
  error: '❌',
  warning: '⚠️',
  info: '💡',
  empty: '📭',
  notify: '🔔',
  
  // Misc
  wave: '👋',
  sparkle: '✨',
  check: '✓',
  bullet: '•',
  arrow: '→'
};

// ================================
// Welcome Message
// ================================

const WELCOME_MESSAGE = `
${EMOJI.wave} *Welcome to ${BRAND.name}!*

${EMOJI.sparkle} _${BRAND.tagline}_

I'm here to help you find academic resources quickly and easily.

*How I can help you:*
${EMOJI.college} Browse by College
${EMOJI.department} Navigate Departments  
${EMOJI.year} Select Your Year
${EMOJI.semester} Choose Semester
${EMOJI.course} Find Courses
${EMOJI.chapter} Access Chapters & Resources

${EMOJI.arrow} *Let's get started!*
`.trim();

// ================================
// Help Message
// ================================

const HELP_MESSAGE = `
${EMOJI.help} *Help & Support*

*${BRAND.name}*

${EMOJI.bullet} *Commands:*
\`/start\` ${EMOJI.arrow} Home menu
\`/browse\` ${EMOJI.arrow} Browse colleges
\`/search <keyword>\` ${EMOJI.arrow} Search resources
\`/favorites\` ${EMOJI.arrow} Your saved items
\`/history\` ${EMOJI.arrow} Recent activity
\`/stats\` ${EMOJI.arrow} Your statistics
\`/help\` ${EMOJI.arrow} This help menu

${EMOJI.bullet} *How to Navigate:*
1. Tap "${EMOJI.college} Browse" to start
2. Select College ${EMOJI.arrow} Department ${EMOJI.arrow} Year ${EMOJI.arrow} Semester
3. Choose a course and chapter
4. Download your resources!

${EMOJI.bullet} *Tips:*
${EMOJI.favorites} Save favorites for quick access
${EMOJI.search} Use search for direct results
${EMOJI.back} Use "Go Back" to navigate

${EMOJI.bullet} *Need Help?*
Contact: ${BRAND.supportContact}
`.trim();

// ================================
// Loading Messages
// ================================

const LOADING = {
  colleges: `${EMOJI.loading} Fetching colleges...`,
  departments: `${EMOJI.loading} Loading departments...`,
  courses: `${EMOJI.loading} Finding courses...`,
  chapters: `${EMOJI.loading} Loading chapters...`,
  resources: `${EMOJI.loading} Preparing resources...`,
  search: `${EMOJI.loading} Searching...`,
  download: `${EMOJI.loading} Preparing your file...`,
  general: `${EMOJI.loading} Please wait...`
};

// ================================
// Error Messages
// ================================

const ERRORS = {
  general: `${EMOJI.warning} Oops! Something went wrong. Please try again.`,
  notFound: `${EMOJI.empty} Sorry, we couldn't find what you're looking for.`,
  sessionExpired: `${EMOJI.warning} Your session has expired. Please tap /start to begin again.`,
  networkError: `${EMOJI.warning} Connection issue. Please check your internet and try again.`,
  fileUnavailable: `${EMOJI.warning} This file is temporarily unavailable. Please try again later.`,
  tryAgain: `\n\n_If this persists, contact ${BRAND.supportContact}_`
};

// ================================
// Empty State Messages
// ================================

const EMPTY = {
  colleges: `${EMOJI.empty} No colleges found. Please try again later.`,
  departments: `${EMOJI.empty} No departments found in this college.`,
  courses: `${EMOJI.empty} No courses available for this selection.`,
  chapters: `${EMOJI.empty} No chapters available yet. Check back soon!`,
  resources: `${EMOJI.empty} No resources available yet.\n\n_We're updating the library daily!_`,
  favorites: `${EMOJI.empty} You haven't saved any favorites yet.\n\n_Tap ${EMOJI.favorites} on any resource to save it._`,
  history: `${EMOJI.empty} No browsing history yet.\n\n_Start exploring to build your history!_`,
  search: `${EMOJI.empty} No results found.\n\n_Try different keywords or browse by college._`
};

// ================================
// Success Messages
// ================================

const SUCCESS = {
  favoriteAdded: `${EMOJI.success} Added to favorites!`,
  favoriteRemoved: `${EMOJI.success} Removed from favorites.`,
  historyCleared: `${EMOJI.success} History cleared.`,
  downloadStarted: `${EMOJI.download} Your download is starting...`
};

// ================================
// Navigation Labels
// ================================

const NAV = {
  home: `${EMOJI.home} Home`,
  back: `${EMOJI.back} Go Back`,
  backTo: (place) => `${EMOJI.back} Back to ${place}`,
  search: `${EMOJI.search} Search`,
  favorites: `${EMOJI.favorites} Favorites`,
  history: `${EMOJI.history} History`,
  help: `${EMOJI.help} Help`,
  browse: `${EMOJI.college} Browse Colleges`,
  allDepts: `📋 All Departments`,
  stats: `${EMOJI.stats} Statistics`,
  startOver: `🔄 Start Over`
};

// ================================
// Section Headers
// ================================

const HEADERS = {
  selectCollege: `${EMOJI.college} *Select Your College*\n\nChoose a college to browse:`,
  selectDepartment: (collegeName) => `${EMOJI.college} *${collegeName}*\n\n${EMOJI.department} Select a department:`,
  selectYear: (deptName) => `${EMOJI.department} *${deptName}*\n\n${EMOJI.year} Select your year:`,
  selectSemester: (year) => `${EMOJI.year} *Year ${year}*\n\n${EMOJI.semester} Select your semester:`,
  selectCourse: (semester, count) => `${EMOJI.semester} *Semester ${semester}*\n\n${EMOJI.course} Found ${count} course(s):`,
  selectChapter: (courseCode, courseName, count) => `${EMOJI.course} *${courseCode} – ${courseName}*\n\n${EMOJI.chapter} ${count} chapter(s) available:`,
  selectResource: (chapter, count) => `${EMOJI.chapter} *${chapter}*\n\n${EMOJI.resource} ${count} resource(s) available:`
};

// ================================
// Utility Functions
// ================================

/**
 * Format navigation breadcrumb
 */
function formatBreadcrumb(path) {
  if (!path) return '';
  return `📍 _${path}_`;
}

/**
 * Get resource type icon
 */
function getTypeIcon(type) {
  return EMOJI[type] || EMOJI.resource;
}

/**
 * Format count text
 */
function formatCount(count, singular, plural) {
  return count === 1 ? `${count} ${singular}` : `${count} ${plural || singular + 's'}`;
}

/**
 * Create typing indicator
 */
async function showTyping(ctx) {
  try {
    await ctx.replyWithChatAction('typing');
  } catch (e) {
    // Ignore typing errors
  }
}

/**
 * Safe edit message (handles "message not modified" error)
 */
async function safeEditMessage(ctx, text, options) {
  try {
    await ctx.editMessageText(text, options);
    return true;
  } catch (error) {
    if (error.message?.includes('message is not modified')) {
      return false; // Message unchanged, not an error
    }
    throw error;
  }
}

/**
 * Safe answer callback (prevents duplicate answers)
 */
async function safeAnswerCallback(ctx, text = '') {
  try {
    await ctx.answerCbQuery(text);
    return true;
  } catch (error) {
    if (error.message?.includes('query is too old')) {
      return false;
    }
    throw error;
  }
}

module.exports = {
  BRAND,
  EMOJI,
  WELCOME_MESSAGE,
  HELP_MESSAGE,
  LOADING,
  ERRORS,
  EMPTY,
  SUCCESS,
  NAV,
  HEADERS,
  formatBreadcrumb,
  getTypeIcon,
  formatCount,
  showTyping,
  safeEditMessage,
  safeAnswerCallback
};
