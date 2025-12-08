/**
 * ================================
 * Course Schema
 * ================================
 * 
 * Represents courses within a department.
 * Each course belongs to one department and can have multiple resources.
 */

const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  // Reference to parent department
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: [true, 'Department reference is required']
  },
  
  // Academic year (1, 2, 3, 4, etc.)
  year: {
    type: Number,
    required: [true, 'Year is required'],
    min: 1,
    max: 6
  },
  
  // Semester (1 or 2)
  semester: {
    type: Number,
    required: [true, 'Semester is required'],
    min: 1,
    max: 2
  },
  
  // Course code (e.g., SE101, IS201)
  courseCode: {
    type: String,
    required: [true, 'Course code is required'],
    trim: true,
    uppercase: true
  },
  
  // Course name (required)
  name: {
    type: String,
    required: [true, 'Course name is required'],
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

// Index for faster queries
courseSchema.index({ departmentId: 1, year: 1, semester: 1 });
courseSchema.index({ courseCode: 1 }, { unique: true });

module.exports = mongoose.model('Course', courseSchema);
