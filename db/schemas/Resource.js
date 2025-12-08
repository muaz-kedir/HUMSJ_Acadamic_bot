/**
 * ================================
 * Resource Schema
 * ================================
 * 
 * Stores all academic files (PDFs, slides, books, exams).
 * Each resource belongs to one course.
 */

const mongoose = require('mongoose');

// Valid resource types
const RESOURCE_TYPES = ['pdf', 'slide', 'book', 'exam'];

const resourceSchema = new mongoose.Schema({
  // Reference to parent course
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Course reference is required']
  },
  
  // Chapter or section (e.g., "Chapter 1", "Midterm")
  chapter: {
    type: String,
    trim: true,
    default: ''
  },
  
  // Resource title
  title: {
    type: String,
    required: [true, 'Resource title is required'],
    trim: true
  },
  
  // Type of resource
  type: {
    type: String,
    required: [true, 'Resource type is required'],
    enum: {
      values: RESOURCE_TYPES,
      message: 'Type must be one of: pdf, slide, book, exam'
    },
    lowercase: true
  },
  
  // File path in /uploads directory
  filePath: {
    type: String,
    required: [true, 'File path is required'],
    trim: true
  },
  
  // Auto-generated timestamp
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for faster queries
resourceSchema.index({ courseId: 1, type: 1 });
resourceSchema.index({ type: 1 });

module.exports = mongoose.model('Resource', resourceSchema);
