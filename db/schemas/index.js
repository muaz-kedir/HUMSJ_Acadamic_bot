/**
 * ================================
 * Schema Index
 * ================================
 * 
 * Central export for all database schemas.
 * Import from here for cleaner code.
 * 
 * Usage:
 * const { College, Department, Course, Resource, User } = require('./db/schemas');
 */

const College = require('./College');
const Department = require('./Department');
const Course = require('./Course');
const Resource = require('./Resource');
const User = require('./User');

module.exports = {
  College,
  Department,
  Course,
  Resource,
  User
};
