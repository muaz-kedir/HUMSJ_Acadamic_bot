/**
 * ================================
 * PDF Utilities
 * ================================
 * 
 * PDF preview, text extraction, and compression.
 */

const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const archiver = require('archiver');

// Cache for compressed files
const compressionCache = new Map();

/**
 * Extract text preview from PDF
 * @param {string} filePath - Path to PDF file
 * @param {number} maxChars - Maximum characters to extract
 * @returns {Promise<Object>} { text, pageCount, error }
 */
async function extractPdfPreview(filePath, maxChars = 500) {
  try {
    if (!fs.existsSync(filePath)) {
      return { text: null, pageCount: 0, error: 'File not found' };
    }
    
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    
    // Get first portion of text
    let preview = data.text.substring(0, maxChars);
    
    // Clean up the text
    preview = preview
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, '\n')
      .trim();
    
    if (data.text.length > maxChars) {
      preview += '...';
    }
    
    return {
      text: preview || 'No text content available.',
      pageCount: data.numpages,
      error: null
    };
    
  } catch (error) {
    console.error('❌ PDF preview error:', error.message);
    return { text: null, pageCount: 0, error: error.message };
  }
}

/**
 * Get PDF info without full parsing
 * @param {string} filePath - Path to PDF file
 * @returns {Promise<Object>} { pageCount, fileSize, error }
 */
async function getPdfInfo(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return { pageCount: 0, fileSize: 0, error: 'File not found' };
    }
    
    const stats = fs.statSync(filePath);
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer, { max: 1 }); // Only parse first page
    
    return {
      pageCount: data.numpages,
      fileSize: stats.size,
      fileSizeMB: (stats.size / (1024 * 1024)).toFixed(2),
      error: null
    };
    
  } catch (error) {
    // Return file size even if PDF parsing fails
    try {
      const stats = fs.statSync(filePath);
      return {
        pageCount: 0,
        fileSize: stats.size,
        fileSizeMB: (stats.size / (1024 * 1024)).toFixed(2),
        error: error.message
      };
    } catch {
      return { pageCount: 0, fileSize: 0, error: error.message };
    }
  }
}

/**
 * Check if file needs compression (> 50MB)
 * @param {string} filePath - Path to file
 * @returns {boolean}
 */
function needsCompression(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.size > 50 * 1024 * 1024; // 50MB
  } catch {
    return false;
  }
}

/**
 * Create ZIP file with PDF and readme
 * @param {string} pdfPath - Path to PDF
 * @param {string} title - Resource title
 * @param {string} chapter - Chapter name
 * @returns {Promise<string>} Path to ZIP file
 */
async function createZipFile(pdfPath, title, chapter) {
  return new Promise((resolve, reject) => {
    try {
      const zipDir = path.join(process.cwd(), 'temp');
      if (!fs.existsSync(zipDir)) {
        fs.mkdirSync(zipDir, { recursive: true });
      }
      
      const zipPath = path.join(zipDir, `${Date.now()}_${title.replace(/[^a-z0-9]/gi, '_')}.zip`);
      const output = fs.createWriteStream(zipPath);
      const archive = archiver('zip', { zlib: { level: 9 } });
      
      output.on('close', () => resolve(zipPath));
      archive.on('error', reject);
      
      archive.pipe(output);
      
      // Add PDF
      if (fs.existsSync(pdfPath)) {
        archive.file(pdfPath, { name: `${title}.pdf` });
      }
      
      // Add readme
      const readme = `HUMSJ Academic Library
========================

Title: ${title}
Chapter: ${chapter}

Downloaded from HUMSJ Academic Library Bot
Telegram: @HUMSJ_AcademicSec_bot

For educational purposes only.
`;
      archive.append(readme, { name: 'README.txt' });
      
      archive.finalize();
      
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Clean up temp files older than 1 hour
 */
function cleanupTempFiles() {
  try {
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) return;
    
    const files = fs.readdirSync(tempDir);
    const now = Date.now();
    const maxAge = 3600000; // 1 hour
    
    files.forEach(file => {
      const filePath = path.join(tempDir, file);
      const stats = fs.statSync(filePath);
      if (now - stats.mtimeMs > maxAge) {
        fs.unlinkSync(filePath);
      }
    });
  } catch (error) {
    console.error('❌ Cleanup error:', error.message);
  }
}

// Run cleanup every 30 minutes
setInterval(cleanupTempFiles, 1800000);

module.exports = {
  extractPdfPreview,
  getPdfInfo,
  needsCompression,
  createZipFile,
  cleanupTempFiles,
  compressionCache
};
