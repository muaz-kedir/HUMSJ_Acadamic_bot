/**
 * ================================
 * File Validator (Day 10)
 * ================================
 * 
 * Validates file integrity before delivery.
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { log } = require('./logger');

// Valid MIME types for resources
const VALID_MIME_TYPES = {
  pdf: ['application/pdf'],
  slide: ['application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'],
  book: ['application/pdf', 'application/epub+zip'],
  exam: ['application/pdf', 'image/jpeg', 'image/png']
};

// Max file sizes (in bytes)
const MAX_FILE_SIZES = {
  pdf: 50 * 1024 * 1024,    // 50MB
  slide: 30 * 1024 * 1024,  // 30MB
  book: 100 * 1024 * 1024,  // 100MB
  exam: 20 * 1024 * 1024    // 20MB
};

/**
 * Validate local file
 */
function validateLocalFile(filePath, type = 'pdf') {
  const result = {
    valid: false,
    exists: false,
    size: 0,
    sizeOk: false,
    error: null
  };
  
  try {
    // Check existence
    if (!fs.existsSync(filePath)) {
      result.error = 'File not found';
      return result;
    }
    result.exists = true;
    
    // Check size
    const stats = fs.statSync(filePath);
    result.size = stats.size;
    
    if (stats.size === 0) {
      result.error = 'File is empty';
      return result;
    }
    
    const maxSize = MAX_FILE_SIZES[type] || MAX_FILE_SIZES.pdf;
    result.sizeOk = stats.size <= maxSize;
    
    if (!result.sizeOk) {
      result.error = `File too large (${(stats.size / 1024 / 1024).toFixed(2)}MB)`;
      return result;
    }
    
    // Check if readable
    try {
      const fd = fs.openSync(filePath, 'r');
      fs.closeSync(fd);
    } catch (e) {
      result.error = 'File not readable';
      return result;
    }
    
    result.valid = true;
    return result;
    
  } catch (error) {
    result.error = error.message;
    return result;
  }
}

/**
 * Validate URL file
 */
async function validateUrlFile(url, type = 'pdf') {
  const result = {
    valid: false,
    accessible: false,
    size: 0,
    contentType: null,
    error: null
  };
  
  try {
    // Check URL format
    if (!url || !url.startsWith('http')) {
      result.error = 'Invalid URL';
      return result;
    }
    
    // HEAD request to check accessibility
    const response = await axios.head(url, { timeout: 10000 });
    result.accessible = response.status === 200;
    
    if (!result.accessible) {
      result.error = `HTTP ${response.status}`;
      return result;
    }
    
    // Check content type
    result.contentType = response.headers['content-type'];
    
    // Check size
    const contentLength = response.headers['content-length'];
    if (contentLength) {
      result.size = parseInt(contentLength);
      const maxSize = MAX_FILE_SIZES[type] || MAX_FILE_SIZES.pdf;
      
      if (result.size > maxSize) {
        result.error = `File too large (${(result.size / 1024 / 1024).toFixed(2)}MB)`;
        return result;
      }
    }
    
    result.valid = true;
    return result;
    
  } catch (error) {
    result.error = error.message;
    return result;
  }
}

/**
 * Validate resource before delivery
 */
async function validateResource(resource) {
  const result = {
    valid: false,
    method: null,
    error: null,
    details: {}
  };
  
  // Try URL first
  if (resource.fileUrl) {
    const urlResult = await validateUrlFile(resource.fileUrl, resource.type);
    if (urlResult.valid) {
      result.valid = true;
      result.method = 'url';
      result.details = urlResult;
      return result;
    }
    result.details.urlError = urlResult.error;
  }
  
  // Try local file
  if (resource.filePath) {
    const filePath = path.join(process.cwd(), resource.filePath);
    const localResult = validateLocalFile(filePath, resource.type);
    if (localResult.valid) {
      result.valid = true;
      result.method = 'local';
      result.details = localResult;
      return result;
    }
    result.details.localError = localResult.error;
  }
  
  result.error = 'No valid file source found';
  return result;
}

/**
 * Report broken resource to admin
 */
async function reportBrokenResource(bot, resource, error) {
  const adminIds = process.env.ADMIN_IDS ? process.env.ADMIN_IDS.split(',') : [];
  
  if (adminIds.length === 0) return;
  
  const message = 
    `⚠️ *Broken Resource Detected*\n\n` +
    `📄 Title: ${resource.title}\n` +
    `📑 Chapter: ${resource.chapter}\n` +
    `🆔 ID: ${resource._id}\n` +
    `❌ Error: ${error}\n\n` +
    `_Please check and fix this resource_`;
  
  for (const adminId of adminIds) {
    try {
      await bot.telegram.sendMessage(adminId.trim(), message, { parse_mode: 'Markdown' });
    } catch (e) {
      log.error('Failed to report broken resource', { error: e.message });
    }
  }
}

module.exports = {
  validateLocalFile,
  validateUrlFile,
  validateResource,
  reportBrokenResource,
  VALID_MIME_TYPES,
  MAX_FILE_SIZES
};
