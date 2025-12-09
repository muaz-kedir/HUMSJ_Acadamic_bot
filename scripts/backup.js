/**
 * ================================
 * Database Backup Script (Day 10)
 * ================================
 * 
 * Backs up database to JSON files.
 * Can be run manually or via cron.
 */

require('dotenv').config();

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const connectDB = require('../db/mongoose');

// Import all schemas
const College = require('../db/schemas/College');
const Department = require('../db/schemas/Department');
const Course = require('../db/schemas/Course');
const Resource = require('../db/schemas/Resource');
const User = require('../db/schemas/User');
const Favorite = require('../db/schemas/Favorite');
const History = require('../db/schemas/History');
const DownloadStat = require('../db/schemas/DownloadStat');
const ReadingProgress = require('../db/schemas/ReadingProgress');

const BACKUP_DIR = path.join(process.cwd(), 'backups');

/**
 * Create backup directory if not exists
 */
function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
}

/**
 * Generate backup filename with timestamp
 */
function getBackupFilename(collection) {
  const date = new Date().toISOString().split('T')[0];
  const time = new Date().toISOString().split('T')[1].split('.')[0].replace(/:/g, '-');
  return `${collection}_${date}_${time}.json`;
}

/**
 * Backup a single collection
 */
async function backupCollection(Model, name) {
  try {
    const data = await Model.find({}).lean();
    const filename = getBackupFilename(name);
    const filepath = path.join(BACKUP_DIR, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
    console.log(`✅ Backed up ${name}: ${data.length} documents → ${filename}`);
    
    return { name, count: data.length, file: filename };
  } catch (error) {
    console.error(`❌ Failed to backup ${name}:`, error.message);
    return { name, count: 0, error: error.message };
  }
}

/**
 * Run full backup
 */
async function runBackup() {
  console.log('🔄 Starting database backup...\n');
  
  ensureBackupDir();
  
  const collections = [
    { model: College, name: 'colleges' },
    { model: Department, name: 'departments' },
    { model: Course, name: 'courses' },
    { model: Resource, name: 'resources' },
    { model: User, name: 'users' },
    { model: Favorite, name: 'favorites' },
    { model: History, name: 'history' },
    { model: DownloadStat, name: 'download_stats' },
    { model: ReadingProgress, name: 'reading_progress' }
  ];
  
  const results = [];
  
  for (const { model, name } of collections) {
    const result = await backupCollection(model, name);
    results.push(result);
  }
  
  // Create summary file
  const summary = {
    timestamp: new Date().toISOString(),
    collections: results,
    totalDocuments: results.reduce((sum, r) => sum + r.count, 0)
  };
  
  const summaryFile = path.join(BACKUP_DIR, `backup_summary_${new Date().toISOString().split('T')[0]}.json`);
  fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));
  
  console.log('\n✅ Backup complete!');
  console.log(`📁 Location: ${BACKUP_DIR}`);
  console.log(`📊 Total documents: ${summary.totalDocuments}`);
  
  return summary;
}

/**
 * Clean old backups (keep last 7 days)
 */
function cleanOldBackups(daysToKeep = 7) {
  try {
    if (!fs.existsSync(BACKUP_DIR)) return;
    
    const files = fs.readdirSync(BACKUP_DIR);
    const cutoff = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
    let deleted = 0;
    
    files.forEach(file => {
      const filepath = path.join(BACKUP_DIR, file);
      const stats = fs.statSync(filepath);
      
      if (stats.mtimeMs < cutoff) {
        fs.unlinkSync(filepath);
        deleted++;
      }
    });
    
    if (deleted > 0) {
      console.log(`🗑️ Cleaned ${deleted} old backup files`);
    }
  } catch (error) {
    console.error('❌ Cleanup error:', error.message);
  }
}

// Run if called directly
if (require.main === module) {
  (async () => {
    try {
      await connectDB();
      await runBackup();
      cleanOldBackups();
      process.exit(0);
    } catch (error) {
      console.error('❌ Backup failed:', error);
      process.exit(1);
    }
  })();
}

module.exports = { runBackup, cleanOldBackups, ensureBackupDir };
