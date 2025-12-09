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
const Favorite = require('./Favorite');
const History = require('./History');
const DownloadStat = require('./DownloadStat');
const ReadingProgress = require('./ReadingProgress');
const Interest = require('./Interest');

module.exports = {
  College,
  Department,
  Course,
  Resource,
  User,
  Favorite,
  History,
  DownloadStat,
  ReadingProgress,
  Interest
};
