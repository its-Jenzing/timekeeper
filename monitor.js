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
/**
 * Server monitor for Time Account App
 * Monitors the server health and restarts if necessary
 */

const http = require('http');
const fs = require('fs');
const { exec } = require('child_process');

// Configuration
const config = {
  serverUrl: 'http://localhost:3000/health',
  logFile: './logs/monitor.log',
  maxRetries: 3,
  retryDelay: 5000, // 5 seconds
  checkInterval: 60000 // 1 minute
};

// Create logs directory if it doesn't exist
if (!fs.existsSync('./logs')) {
  fs.mkdirSync('./logs', { recursive: true });
}

function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  console.log(message);
  fs.appendFile(config.logFile, logMessage, (err) => {
    if (err) console.error('Error writing to log file:', err);
  });
}

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
          log(`Server returned non-JSON response: ${data}`);
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
    log(`Server failed to respond after ${config.maxRetries} attempts. Restarting...`);
    restartServer();
  }
}

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
    
    // Wait a bit and check if the server is back up
    setTimeout(() => {
      log('Checking if server is back up...');
      http.get(config.serverUrl, (res) => {
        if (res.statusCode === 200) {
          log('Server successfully restarted and is responding.');
        } else {
          log(`Server restarted but returned status code: ${res.statusCode}`);
        }
      }).on('error', (err) => {
        log(`Server restarted but is not responding: ${err.message}`);
      });
    }, 10000); // Wait 10 seconds before checking
  });
}

// Start the monitoring process
log('Starting server monitor...');
checkServerHealth();

// Set up periodic health checks
setInterval(checkServerHealth, config.checkInterval);

// Handle process termination
process.on('SIGINT', () => {
  log('Monitor stopping...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  log('Monitor stopping...');
  process.exit(0);
});
