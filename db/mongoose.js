/**
 * ================================
 * MongoDB Connection Module
 * ================================
 * 
 * Handles MongoDB connection using Mongoose with:
 * - Connection success/error logging
 * - Reconnection attempt logic
 * - Event handlers for connection state changes
 */

const mongoose = require('mongoose');

/**
 * Connect to MongoDB Atlas
 * @returns {Promise} Mongoose connection promise
 */
async function connectDB() {
  // Check if MONGO_URI exists - allow bot to run without DB for testing
  if (!process.env.MONGO_URI) {
    console.warn('⚠️  Warning: MONGO_URI not defined. Running without database.');
    console.warn('⚠️  /testdb command will not work until MongoDB is configured.');
    return null;
  }

  try {
    // Connect to MongoDB (no deprecated options needed in Mongoose 8+)
    const conn = await mongoose.connect(process.env.MONGO_URI);

    // Success log
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;

  } catch (error) {
    // Error log with details - don't exit, allow bot to run without DB
    console.error('❌ MongoDB connection failed:', error.message);
    console.warn('⚠️  Bot will continue without database functionality.');
    return null;
  }
}

// ================================
// Connection Event Handlers
// ================================

// Fired when connection is lost
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB disconnected');
});

// Fired when reconnection succeeds
mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB reconnected successfully');
});

// Fired on any connection error
mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err.message);
});

module.exports = connectDB;
