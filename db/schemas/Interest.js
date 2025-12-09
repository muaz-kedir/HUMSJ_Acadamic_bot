/**
 * ================================
 * Interest Schema (Day 10)
 * ================================
 * 
 * Tracks user interest in unavailable resources.
 * Used for "Notify me when available" feature.
 */

const mongoose = require('mongoose');

const interestSchema = new mongoose.Schema({
  telegramId: {
    type: String,
    required: true,
    index: true
  },
  
  // What they're interested in
  type: {
    type: String,
    enum: ['course', 'chapter', 'resource'],
    required: true
  },
  
  // Reference IDs
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  },
  
  chapter: {
    type: String
  },
  
  // Status
  notified: {
    type: Boolean,
    default: false
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index for efficient queries
interestSchema.index({ courseId: 1, chapter: 1, notified: 1 });

module.exports = mongoose.model('Interest', interestSchema);
