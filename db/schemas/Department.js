/**
 * ================================
 * Department Schema
 * ================================
 * 
 * Represents departments within a college.
 * Each department belongs to one college and contains multiple courses.
 */

const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  // Reference to parent college
  collegeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
    required: [true, 'College reference is required']
  },
  
  // Department name (required)
  name: {
    type: String,
    required: [true, 'Department name is required'],
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

// Compound index for unique department names within a college
departmentSchema.index({ collegeId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Department', departmentSchema);
