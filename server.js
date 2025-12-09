/**
 * ================================
 * Health Check Server (Day 10)
 * ================================
 * 
 * Express server for health checks and monitoring.
 */

const express = require('express');
const mongoose = require('mongoose');
const { log } = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 3000;
const startTime = Date.now();

// Health check endpoint
app.get('/health', async (req, res) => {
  const uptime = Math.floor((Date.now() - startTime) / 1000);
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  
  res.json({
    status: 'ok',
    uptime: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${uptime % 60}s`,
    database: dbStatus,
    memory: {
      used: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
      total: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`
    },
    date: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Detailed status endpoint (admin only)
app.get('/status', async (req, res) => {
  try {
    const DownloadStat = require('./db/schemas/DownloadStat');
    const User = require('./db/schemas/User');
    
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const stats = {
      totalUsers: await User.countDocuments(),
      todayDownloads: await DownloadStat.countDocuments({
        timestamp: { $gte: todayStart },
        action: 'download'
      }),
      totalDownloads: await DownloadStat.countDocuments({ action: 'download' })
    };
    
    res.json({ status: 'ok', stats });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Start server
function startHealthServer() {
  app.listen(PORT, () => {
    log.info(`Health server running on port ${PORT}`);
  });
}

module.exports = { startHealthServer, app };
