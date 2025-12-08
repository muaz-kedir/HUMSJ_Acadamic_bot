/**
 * ================================
 * College Schema
 * ================================
 * 
 * Represents academic colleges in the university.
 * Each college contains multiple departments.
 */

const mongoose = require('mongoose');

const collegeSchema = new mongoose.Schema({
  // College name (required)
  name: {
    type: String,
    required: [true, 'College name is required'],
    trim: true
  },
  
  // Optional description
  description: {
    type: String,
    trim: true,
    default: ''
  },
  
  // Auto-generated timestamp
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries (unique)
collegeSchema.index({ name: 1 }, { unique: true });

module.exports = mongoose.model('College', collegeSchema);
