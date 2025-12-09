/**
 * ================================
 * Task Scheduler (Day 10)
 * ================================
 * 
 * Cron jobs for backup, cleanup, etc.
 */

const cron = require('node-cron');
const { log } = require('./logger');
const { runBackup, cleanOldBackups } = require('../scripts/backup');
const { runCleanup } = require('../scripts/cleanup');

/**
 * Initialize all scheduled tasks
 */
function initScheduler() {
  log.info('Initializing task scheduler...');
  
  // Daily backup at 2:00 AM
  cron.schedule('0 2 * * *', async () => {
    log.info('Running scheduled backup...');
    try {
      await runBackup();
      cleanOldBackups(7);
      log.info('Scheduled backup completed');
    } catch (error) {
      log.error('Scheduled backup failed', { error: error.message });
    }
  }, {
    timezone: 'Africa/Addis_Ababa'
  });
  
  // Daily cleanup at 3:00 AM
  cron.schedule('0 3 * * *', async () => {
    log.info('Running scheduled cleanup...');
    try {
      await runCleanup();
      log.info('Scheduled cleanup completed');
    } catch (error) {
      log.error('Scheduled cleanup failed', { error: error.message });
    }
  }, {
    timezone: 'Africa/Addis_Ababa'
  });
  
  // Temp file cleanup every hour
  cron.schedule('0 * * * *', () => {
    const { cleanTempFiles } = require('../scripts/cleanup');
    cleanTempFiles();
  });
  
  log.info('Task scheduler initialized');
  log.info('Scheduled: Daily backup at 2:00 AM, Cleanup at 3:00 AM');
}

module.exports = { initScheduler };
