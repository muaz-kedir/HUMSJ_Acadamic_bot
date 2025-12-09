/**
 * ================================
 * Reading Progress Schema
 * ================================
 * 
 * Tracks user's reading progress for continue reading feature.
 */

const mongoose = require('mongoose');

const readingProgressSchema = new mongoose.Schema({
  oduserId: {
    type: String,
    required: true,
    index: true
  },
  
  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resource',
    required: true
  },
  
  lastPage: {
    type: Number,
    default: 1
  },
  
  totalPages: {
    type: Number,
    default: 0
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

readingProgressSchema.index({ oduserId: 1, resourceId: 1 }, { unique: true });

module.exports = mongoose.model('ReadingProgress', readingProgressSchema);
