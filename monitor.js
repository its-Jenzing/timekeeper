/**
 * Timekeeper Server Monitor for TrueNAS
 * 
 * This script monitors the Timekeeper server and can restart it if needed.
 * It's designed to work in a TrueNAS jail environment.
 */

const http = require('http');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  serverUrl: 'http://localhost:3000/health',
  checkInterval: 60000, // Check every minute
  maxRetries: 3,
  retryDelay: 5000, // 5 seconds between retries
  logFile: path.join(__dirname, 'logs', 'monitor.log')
};

// Ensure log directory exists
const logDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// Log function
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  console.log(message);
  fs.appendFile(config.logFile, logMessage, (err) => {
    if (err) console.error('Error writing to log file:', err);
  });
}

// Check server health
function checkServerHealth() {
  log('Checking server health...');
  
  http.get(config.serverUrl, (res) => {
    if (res.statusCode === 200) {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const healthData = JSON.parse(data);
          log(`Server is healthy. Status: ${healthData.status}`);
        } catch (e) {
          log(`Error parsing health data: ${e.message}`);
        }
      });
    } else {
      log(`Server returned status code: ${res.statusCode}`);
      retryOrRestart(0);
    }
  }).on('error', (err) => {
    log(`Error connecting to server: ${err.message}`);
    retryOrRestart(0);
  });
}

// Retry connection or restart server
function retryOrRestart(retryCount) {
  if (retryCount < config.maxRetries) {
    log(`Retrying in ${config.retryDelay / 1000} seconds... (Attempt ${retryCount + 1}/${config.maxRetries})`);
    setTimeout(() => {
      http.get(config.serverUrl, (res) => {
        if (res.statusCode === 200) {
          log('Server recovered.');
        } else {
          retryOrRestart(retryCount + 1);
        }
      }).on('error', () => {
        retryOrRestart(retryCount + 1);
      });
    }, config.retryDelay);
  } else {
    log('Max retries reached. Attempting to restart server...');
    restartServer();
  }
}

// Restart the server
function restartServer() {
  log('Restarting server...');
  
  // Use FreeBSD service command for TrueNAS
  exec('service timekeeper restart', (error, stdout, stderr) => {
    if (error) {
      log(`Error restarting server: ${error.message}`);
      log(`stderr: ${stderr}`);
      return;
    }
    
    log(`Server restart initiated: ${stdout}`);
    
    // Check if restart was successful after a delay
    setTimeout(checkServerHealth, 10000);
  });
}

// Start monitoring
log('Timekeeper Server Monitor started');
checkServerHealth();
setInterval(checkServerHealth, config.checkInterval);

// Handle graceful shutdown
process.on('SIGTERM', () => {
  log('Monitor received SIGTERM, shutting down');
  process.exit(0);
});

process.on('SIGINT', () => {
  log('Monitor received SIGINT, shutting down');
  process.exit(0);
});
