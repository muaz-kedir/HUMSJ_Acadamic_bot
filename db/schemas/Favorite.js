/**
 * ================================
 * Favorite Schema
 * ================================
 * 
 * Stores user's favorite resources.
 */

const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
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
  
  // When added
  addedAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index to prevent duplicates
favoriteSchema.index({ userId: 1, resourceId: 1 }, { unique: true });

module.exports = mongoose.model('Favorite', favoriteSchema);
