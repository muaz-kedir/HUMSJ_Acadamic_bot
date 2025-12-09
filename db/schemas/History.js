/**
 * ================================
 * History Schema
 * ================================
 * 
 * Tracks user browsing history.
 */

const mongoose = require('mongoose');

const historySchema = new mongoose.Schema({
  // Telegram user ID
  oduserId: {
    type: String,
    required: true,
    index: true
  },
  
  // Reference to resource
  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resource',
    required: true
  },
  
  // Action type
  action: {
    type: String,
    enum: ['view', 'download'],
    default: 'view'
  },
  
  // When accessed
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient queries
historySchema.index({ oduserId: 1, timestamp: -1 });

module.exports = mongoose.model('History', historySchema);
