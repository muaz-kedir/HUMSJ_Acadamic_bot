/**
 * ================================
 * Session Manager
 * ================================
 * 
 * Stores user navigation and search state in memory.
 * 
 * Navigation: College → Department → Year → Semester → Course → Chapter → Resource
 * Search: Keyword, page, filter
 */

// In-memory session storage
const userSession = {};
const searchSession = {};

// ================================
// Navigation Session Functions
// ================================

/**
 * Get or create navigation session for a user
 * @param {number|string} chatId - Telegram chat ID
 * @returns {Object} User session object
 */
function getSession(chatId) {
  if (!userSession[chatId]) {
    userSession[chatId] = {
      collegeId: null,
      collegeName: null,
      departmentId: null,
      departmentName: null,
      year: null,
      semester: null,
      courseId: null,
      courseCode: null,
      courseName: null,
      chapter: null,
      resourceId: null
    };
  }
  return userSession[chatId];
}

/**
 * Update navigation session with new values
 * @param {number|string} chatId - Telegram chat ID
 * @param {Object} updates - Key-value pairs to update
 */
function updateSession(chatId, updates) {
  const session = getSession(chatId);
  Object.assign(session, updates);
}

/**
 * Clear navigation session for a user
 * @param {number|string} chatId - Telegram chat ID
 */
function clearSession(chatId) {
  delete userSession[chatId];
}

/**
 * Get current navigation path as string
 * @param {number|string} chatId - Telegram chat ID
 * @returns {string} Navigation breadcrumb
 */
function getNavigationPath(chatId) {
  const session = getSession(chatId);
  const parts = [];
  
  if (session.collegeName) parts.push(session.collegeName);
  if (session.departmentName) parts.push(session.departmentName);
  if (session.year) parts.push(`Year ${session.year}`);
  if (session.semester) parts.push(`Sem ${session.semester}`);
  if (session.courseCode) parts.push(session.courseCode);
  if (session.chapter) parts.push(session.chapter);
  
  return parts.join(' → ');
}

// ================================
// Search Session Functions
// ================================

/**
 * Get search session for a user
 * @param {number|string} chatId - Telegram chat ID
 * @returns {Object|null} Search session or null
 */
function getSearchSession(chatId) {
  return searchSession[chatId] || null;
}

/**
 * Update search session
 * @param {number|string} chatId - Telegram chat ID
 * @param {Object} data - Search data (keyword, page, filter)
 */
function updateSearchSession(chatId, data) {
  searchSession[chatId] = {
    keyword: data.keyword || '',
    page: data.page || 0,
    filter: data.filter || 'all',
    timestamp: Date.now()
  };
}

/**
 * Clear search session
 * @param {number|string} chatId - Telegram chat ID
 */
function clearSearchSession(chatId) {
  delete searchSession[chatId];
}

module.exports = {
  // Navigation
  userSession,
  getSession,
  updateSession,
  clearSession,
  getNavigationPath,
  
  // Search
  searchSession,
  getSearchSession,
  updateSearchSession,
  clearSearchSession
};
