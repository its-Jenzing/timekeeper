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

// Check if web-build directory exists
const webBuildPath = path.join(__dirname, 'web-build');
if (!fs.existsSync(webBuildPath)) {
  console.warn(`Warning: '${webBuildPath}' directory not found. Creating empty directory.`);
  fs.mkdirSync(webBuildPath, { recursive: true });
  
  // Create a simple index.html file as fallback
  const fallbackHtml = `
<!DOCTYPE html>
<html>
<head>
  <title>Timekeeper App</title>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
    .container { max-width: 800px; margin: 0 auto; }
    .error { color: #e74c3c; }
    .info { margin-top: 30px; background: #f8f9fa; padding: 20px; border-radius: 5px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Timekeeper Server</h1>
    <p class="error">Web application files not found.</p>
    <p>The server is running, but the web application files are missing.</p>
    <div class="info">
      <p>Server health check is available at: <a href="/health">/health</a></p>
      <p>Server information is available at: <a href="/server-info">/server-info</a></p>
    </div>
  </div>
</body>
</html>
  `;
  fs.writeFileSync(path.join(webBuildPath, 'index.html'), fallbackHtml);
}

// Log the contents of the web-build directory
console.log('Contents of web-build directory:');
try {
  const webBuildContents = fs.readdirSync(webBuildPath);
  console.log(webBuildContents);
} catch (err) {
  console.error('Error reading web-build directory:', err);
}

// Serve static files from the web-build directory
app.use(express.static(webBuildPath));

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

// Add a route for the app
app.get('/app', (req, res) => {
  const appPath = path.join(webBuildPath, 'app.html');
  if (fs.existsSync(appPath)) {
    res.sendFile(appPath);
  } else {
    res.status(404).send('App not found. Please run the build script to create the application files.');
  }
});

// Handle all other routes by serving the index.html file
app.get('*', (req, res) => {
  const indexPath = path.join(webBuildPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Application files not found. Please build the web application first.');
  }
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
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\nERROR: Port ${PORT} is already in use!`);
    console.error(`Another instance of the server may be running.`);
    console.error(`Try stopping the existing service with: service timekeeper stop`);
  } else {
    console.error(`\nERROR: Failed to start server: ${err.message}`);
  }
  process.exit(1);
});
