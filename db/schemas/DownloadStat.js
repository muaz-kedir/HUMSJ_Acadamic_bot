/**
 * ================================
 * Download Statistics Schema
 * ================================
 * 
 * Tracks download analytics.
 */

const mongoose = require('mongoose');

const downloadStatSchema = new mongoose.Schema({
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
  
  action: {
    type: String,
    enum: ['download', 'preview', 'read'],
    default: 'download'
  },
  
  timestamp: {
    type: Date,
    default: Date.now
  }
});

downloadStatSchema.index({ resourceId: 1 });
downloadStatSchema.index({ timestamp: -1 });

module.exports = mongoose.model('DownloadStat', downloadStatSchema);
