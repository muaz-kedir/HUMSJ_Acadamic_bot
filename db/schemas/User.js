/**
 * ================================
 * User Schema
 * ================================
 * 
 * Stores Telegram bot users and their favorites.
 * Used to track user preferences and saved resources.
 */

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // Telegram user ID (unique identifier)
  telegramId: {
    type: String,
    required: [true, 'Telegram ID is required'],
    trim: true
  },
  
  // User's favorite resources
  favorites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resource'
  }],
  
  // Auto-generated timestamp
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster lookups (unique)
userSchema.index({ telegramId: 1 }, { unique: true });

module.exports = mongoose.model('User', userSchema);
