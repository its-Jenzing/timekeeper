const express = require('express');
const path = require('path');
const compression = require('compression');
const cors = require('cors');
const os = require('os');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for all routes
app.use(cors());

// Compress all responses
app.use(compression());

// Serve static files from the web-build directory
app.use(express.static(path.join(__dirname, 'web-build')));

// Add a health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
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
        addresses.push(info.address);
      }
    }
  }
  
  return addresses;
}

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n======================================`);
  console.log(`Server running at http://0.0.0.0:${PORT}`);
  console.log(`\nAccess this app from other devices using one of these URLs:`);
  
  const ipAddresses = getServerIPs();
  if (ipAddresses.length > 0) {
    ipAddresses.forEach(ip => {
      console.log(`http://${ip}:${PORT}`);
    });
  } else {
    console.log(`http://YOUR_SERVER_IP:${PORT}`);
  }
  console.log(`======================================\n`);
});
