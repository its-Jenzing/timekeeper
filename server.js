const express = require('express');
const path = require('path');
const compression = require('compression');
const cors = require('cors');
const os = require('os');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Create a log directory if it doesn't exist
const logDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// Simple logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const log = `[${timestamp}] ${req.method} ${req.url}\n`;
  fs.appendFile(path.join(logDir, 'access.log'), log, (err) => {
    if (err) console.error('Error writing to log file:', err);
  });
  next();
});

// Enable CORS for all routes
app.use(cors());

// Compress all responses
app.use(compression());

// Serve static files from the web-build directory
app.use(express.static(path.join(__dirname, 'web-build')));

// Add a health check endpoint
app.get('/health', (req, res) => {
  // Get system info for health check
  const systemInfo = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    hostname: os.hostname(),
    platform: os.platform(),
    uptime: os.uptime(),
    freemem: os.freemem(),
    totalmem: os.totalmem(),
    cpus: os.cpus().length
  };
  
  res.status(200).json(systemInfo);
});

// Add a server info endpoint (useful for TrueNAS jail diagnostics)
app.get('/server-info', (req, res) => {
  const serverInfo = {
    platform: os.platform(),
    release: os.release(),
    type: os.type(),
    arch: os.arch(),
    hostname: os.hostname(),
    networkInterfaces: os.networkInterfaces(),
    uptime: os.uptime(),
    loadavg: os.loadavg(),
    totalmem: os.totalmem(),
    freemem: os.freemem(),
    cpus: os.cpus(),
    userInfo: os.userInfo()
  };
  
  res.status(200).json(serverInfo);
});

// Handle all other routes by serving the index.html file
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'web-build', 'index.html'));
});

// Get server IP addresses to display
function getServerIPs() {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  
  for (const interfaceName in interfaces) {
    const interfaceInfo = interfaces[interfaceName];
    for (const info of interfaceInfo) {
      // Skip internal and non-IPv4 addresses
      if (!info.internal && info.family === 'IPv4') {
        addresses.push({
          interface: interfaceName,
          address: info.address,
          netmask: info.netmask
        });
      }
    }
  }
  
  return addresses;
}

// Detect if running in a FreeBSD jail (TrueNAS uses FreeBSD)
function isRunningInJail() {
  try {
    // Check for FreeBSD jail-specific files or environment
    if (os.platform() === 'freebsd') {
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  // Close server and exit
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Start the server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n======================================`);
  console.log(`Timekeeper Server v1.0`);
  console.log(`Running on TrueNAS 13.0-U6.7 compatible environment`);
  console.log(`Server started at: ${new Date().toISOString()}`);
  console.log(`Server running at http://0.0.0.0:${PORT}`);
  
  if (isRunningInJail()) {
    console.log(`\nDetected FreeBSD jail environment (TrueNAS)`);
  }
  
  console.log(`\nAccess this app from other devices using one of these URLs:`);
  
  const ipAddresses = getServerIPs();
  if (ipAddresses.length > 0) {
    ipAddresses.forEach(ip => {
      console.log(`http://${ip.address}:${PORT} (${ip.interface})`);
    });
  } else {
    console.log(`http://YOUR_SERVER_IP:${PORT}`);
  }
  
  console.log(`\nHealth check: http://YOUR_SERVER_IP:${PORT}/health`);
  console.log(`Server info: http://YOUR_SERVER_IP:${PORT}/server-info`);
  console.log(`======================================\n`);
});
