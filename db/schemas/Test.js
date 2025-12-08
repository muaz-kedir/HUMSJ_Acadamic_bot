/**
 * ================================
 * Test Schema (Temporary)
 * ================================
 * 
 * A simple schema used to verify MongoDB connection.
 * This will be removed after testing is complete.
 * Real schemas (colleges, departments, etc.) come in Day 3-4.
 */

const mongoose = require('mongoose');

// Define the test schema
const testSchema = new mongoose.Schema({
  // Simple name field for testing
  name: {
    type: String,
    default: 'Test Entry'
  },
  // Auto-generated timestamp
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Export the model
module.exports = mongoose.model('Test', testSchema);
