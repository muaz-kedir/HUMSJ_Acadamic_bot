/**
 * ================================
 * Session Manager
 * ================================
 * 
 * Stores user navigation state in memory.
 * Tracks user selections through the browse flow:
 * College → Department → Year → Semester → Course → Chapter → Resource
 * 
 * Used by handlers to maintain context between selections.
 */

// In-memory session storage
// Key: chatId, Value: user's current selections
const userSession = {};

/**
 * Get or create session for a user
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
 * Update session with new values
 * @param {number|string} chatId - Telegram chat ID
 * @param {Object} updates - Key-value pairs to update
 */
function updateSession(chatId, updates) {
  const session = getSession(chatId);
  Object.assign(session, updates);
}

/**
 * Clear session for a user
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

module.exports = {
  userSession,
  getSession,
  updateSession,
  clearSession,
  getNavigationPath
};
