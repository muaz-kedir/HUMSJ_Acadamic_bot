/**
 * ================================
 * AI Cache Schema
 * ================================
 * 
 * Caches AI-generated content for resources.
 */

const mongoose = require('mongoose');

const AICacheSchema = new mongoose.Schema({
  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resource',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['summary', 'flashcards', 'quiz', 'mindmap'],
    required: true
  },
  content: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  textHash: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 604800 // Auto-delete after 7 days
  }
});

// Compound index for efficient lookups
AICacheSchema.index({ resourceId: 1, type: 1 }, { unique: true });

module.exports = mongoose.model('AICache', AICacheSchema);
