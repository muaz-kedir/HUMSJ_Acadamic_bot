/**
 * ================================
 * Daily Cleanup Script (Day 10)
 * ================================
 * 
 * Cleans up temp files, old logs, and optimizes DB.
 */

require('dotenv').config();

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const connectDB = require('../db/mongoose');

/**
 * Clean temp directory
 */
function cleanTempFiles() {
  const tempDir = path.join(process.cwd(), 'temp');
  
  if (!fs.existsSync(tempDir)) {
    console.log('📁 No temp directory found');
    return 0;
  }
  
  const files = fs.readdirSync(tempDir);
  const maxAge = 3600000; // 1 hour
  const now = Date.now();
  let deleted = 0;
  
  files.forEach(file => {
    const filepath = path.join(tempDir, file);
    try {
      const stats = fs.statSync(filepath);
      if (now - stats.mtimeMs > maxAge) {
        fs.unlinkSync(filepath);
        deleted++;
      }
    } catch (error) {
      console.error(`Failed to delete ${file}:`, error.message);
    }
  });
  
  console.log(`🗑️ Cleaned ${deleted} temp files`);
  return deleted;
}

/**
 * Clean old rate limit entries (handled in memory, but log it)
 */
function cleanRateLimits() {
  console.log('✅ Rate limits are auto-cleaned in memory');
}

/**
 * Optimize database indexes
 */
async function optimizeIndexes() {
  try {
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    for (const col of collections) {
      try {
        await mongoose.connection.db.collection(col.name).reIndex();
      } catch (e) {
        // reIndex may not be available in all MongoDB versions
      }
    }
    
    console.log('✅ Database indexes optimized');
  } catch (error) {
    console.error('❌ Index optimization error:', error.message);
  }
}

/**
 * Clean orphaned history entries
 */
async function cleanOrphanedData() {
  try {
    const History = require('../db/schemas/History');
    const Resource = require('../db/schemas/Resource');
    
    // Find history entries with deleted resources
    const histories = await History.find({}).lean();
    let cleaned = 0;
    
    for (const h of histories) {
      if (h.resourceId) {
        const exists = await Resource.exists({ _id: h.resourceId });
        if (!exists) {
          await History.deleteOne({ _id: h._id });
          cleaned++;
        }
      }
    }
    
    if (cleaned > 0) {
      console.log(`🗑️ Cleaned ${cleaned} orphaned history entries`);
    } else {
      console.log('✅ No orphaned data found');
    }
  } catch (error) {
    console.error('❌ Orphan cleanup error:', error.message);
  }
}

/**
 * Run full cleanup
 */
async function runCleanup() {
  console.log('🔄 Starting daily cleanup...\n');
  
  cleanTempFiles();
  cleanRateLimits();
  await optimizeIndexes();
  await cleanOrphanedData();
  
  console.log('\n✅ Cleanup complete!');
}

// Run if called directly
if (require.main === module) {
  (async () => {
    try {
      await connectDB();
      await runCleanup();
      process.exit(0);
    } catch (error) {
      console.error('❌ Cleanup failed:', error);
      process.exit(1);
    }
  })();
}

module.exports = { runCleanup, cleanTempFiles };
