#!/bin/sh
# TrueNAS Core (FreeBSD) Deployment Script for Time Account App

# Set strict error handling
set -e

echo "====================================================="
echo "TIME ACCOUNT APP DEPLOYMENT FOR TRUENAS CORE"
echo "====================================================="

# Check if running as root or with sufficient privileges
if [ "$(id -u)" -ne 0 ]; then
  echo "Warning: This script should ideally be run as root or with sudo"
  echo "Some operations might fail without proper permissions"
  echo "Continue anyway? (y/n)"
  read -r answer
  if [ "$answer" != "y" ] && [ "$answer" != "Y" ]; then
    echo "Deployment cancelled."
    exit 1
  fi
fi

# Check for required dependencies
check_dependency() {
  if ! command -v "$1" > /dev/null 2>&1; then
    echo "$1 is not installed. Installing..."
    pkg install -y "$2"
  else
    echo "$1 is already installed."
  fi
}

echo "Checking dependencies..."
check_dependency node nodejs
check_dependency npm npm

# Create logs directory if it doesn't exist
if [ ! -d "logs" ]; then
  echo "Creating logs directory..."
  mkdir -p logs
  chmod 755 logs
fi

# Install dependencies
echo "Installing Node.js dependencies..."
npm install --production

# Build the web version
echo "Building web application..."
npm run build

# Check if web-build directory exists
if [ ! -d "web-build" ]; then
  echo "Error: web-build directory not found. Build may have failed."
  exit 1
fi

# Copy the FreeBSD rc script to the proper location
echo "Installing FreeBSD service..."
cp timekeeper.rc /usr/local/etc/rc.d/timekeeper
chmod 555 /usr/local/etc/rc.d/timekeeper

# Enable the service in rc.conf
echo "Enabling service in /etc/rc.conf..."
sysrc timekeeper_enable="YES"
sysrc timekeeper_dir="$(pwd)"

# Start the service
echo "Starting service..."
service timekeeper start

echo "====================================================="
echo "DEPLOYMENT COMPLETE!"
echo "====================================================="
echo
echo "Your app is now running as a service!"
echo
echo "Access your app at: http://$(ifconfig | grep -E 'inet.[0-9]' | grep -v '127.0.0.1' | awk '{ print $2 }' | head -n 1):3000"
echo
echo "Useful commands:"
echo "- Check service status: service timekeeper status"
echo "- Restart service: service timekeeper restart"
echo "- Stop service: service timekeeper stop"
echo "- View logs: tail -f logs/access.log"
echo
echo "====================================================="
#!/bin/sh
# Complete deployment script for Time Account App in TrueNAS/FreeBSD jail
# This script handles everything from installation to service setup

set -e  # Exit on error

echo "====================================================="
echo "TIME ACCOUNT APP DEPLOYMENT FOR TRUENAS/FREEBSD"
echo "====================================================="

# Check if running as root
if [ "$(id -u)" -ne 0 ]; then
  echo "This script must be run as root to install the service"
  echo "Please run with: sudo $0"
  exit 1
fi

# Determine script location
SCRIPT_DIR=$(dirname "$(realpath "$0")")
APP_DIR=$(pwd)

echo "Script location: $SCRIPT_DIR"
echo "Current directory: $APP_DIR"

# Check for required dependencies
check_dependency() {
  if ! command -v "$1" > /dev/null 2>&1; then
    echo "$1 is not installed. Installing..."
    pkg install -y "$2"
    return $?
  else
    echo "$1 is already installed."
    return 0
  fi
}

echo "Checking dependencies..."
check_dependency git git || { echo "Failed to install git"; exit 1; }
check_dependency node nodejs || { echo "Failed to install Node.js"; exit 1; }
check_dependency npm npm || { echo "Failed to install npm"; exit 1; }

# Ask if user wants to install in current directory or create a new one
echo "Do you want to install in the current directory ($APP_DIR)? (y/n)"
read -r install_here
if [ "$install_here" != "y" ] && [ "$install_here" != "Y" ]; then
  echo "Enter the name of the directory to create:"
  read -r DEPLOY_DIR
  
  if [ -d "$DEPLOY_DIR" ]; then
    echo "The directory $DEPLOY_DIR already exists."
    echo "Do you want to overwrite it? (y/n)"
    read -r overwrite
    if [ "$overwrite" = "y" ] || [ "$overwrite" = "Y" ]; then
      echo "Removing existing directory..."
      rm -rf "$DEPLOY_DIR"
    else
      echo "Deployment cancelled."
      exit 0
    fi
  fi
  
  echo "Creating directory $DEPLOY_DIR..."
  mkdir -p "$DEPLOY_DIR"
  cd "$DEPLOY_DIR"
  APP_DIR=$(pwd)
fi

# Install dependencies
echo "Installing Node.js dependencies..."
npm install --save express compression cors
npm install --save-dev @babel/core @types/react typescript

# Create logs directory
echo "Creating logs directory..."
mkdir -p logs
chmod 755 logs

# Create or update server.js if needed
if [ ! -f "server.js" ] || [ "$install_here" != "y" ]; then
  echo "Creating server.js file..."
  cat > server.js << 'EOL'
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
});
EOL
fi

# Create monitor.js if needed
if [ ! -f "monitor.js" ] || [ "$install_here" != "y" ]; then
  echo "Creating monitor.js file..."
  cat > monitor.js << 'EOL'
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
EOL
fi

# Run the build script
echo "Building web application..."
sh build.sh

# Create FreeBSD service file
echo "Creating FreeBSD service file..."
cat > timekeeper.rc << EOL
#!/bin/sh
#
# PROVIDE: timekeeper
# REQUIRE: NETWORKING
# KEYWORD: shutdown
#
# Add the following lines to /etc/rc.conf to enable timekeeper:
# timekeeper_enable="YES"
#
# timekeeper_enable (bool):  Set to "NO" by default.
#                            Set it to "YES" to enable timekeeper.
# timekeeper_user (str):     Set to "root" by default.
# timekeeper_group (str):    Set to "wheel" by default.
# timekeeper_dir (str):      Set to "$APP_DIR" by default.
# timekeeper_port (int):     Set to "3000" by default.
# timekeeper_log (str):      Set to "/var/log/timekeeper.log" by default.

. /etc/rc.subr

name="timekeeper"
rcvar=timekeeper_enable

load_rc_config \$name

: \${timekeeper_enable:="NO"}
: \${timekeeper_user:="root"}
: \${timekeeper_group:="wheel"}
: \${timekeeper_dir:="$APP_DIR"}
: \${timekeeper_port:="3000"}
: \${timekeeper_log:="/var/log/timekeeper.log"}
: \${timekeeper_node:="/usr/local/bin/node"}

pidfile="/var/run/\${name}.pid"
command="/usr/sbin/daemon"
command_args="-P \${pidfile} -r -f -o \${timekeeper_log} -u \${timekeeper_user} \${timekeeper_node} \${timekeeper_dir}/server.js"

start_precmd="timekeeper_precmd"
status_cmd="timekeeper_status"
stop_cmd="timekeeper_stop"
restart_cmd="timekeeper_restart"
monitor_cmd="timekeeper_monitor"
extra_commands="status restart monitor"

timekeeper_precmd()
{
    if [ ! -d "/var/run" ]; then
        mkdir -p /var/run
    fi
    
    if [ ! -e "\${timekeeper_log}" ]; then
        touch "\${timekeeper_log}"
        chown "\${timekeeper_user}:\${timekeeper_group}" "\${timekeeper_log}"
    fi
    
    # Create logs directory in app folder if it doesn't exist
    if [ ! -d "\${timekeeper_dir}/logs" ]; then
        mkdir -p "\${timekeeper_dir}/logs"
        chown "\${timekeeper_user}:\${timekeeper_group}" "\${timekeeper_dir}/logs"
    fi
    
    # Check if node is installed
    if ! which node >/dev/null 2>&1; then
        echo "Node.js is not installed. Please install it with: pkg install -y node"
        return 1
    fi
    
    # Check if the application directory exists
    if [ ! -d "\${timekeeper_dir}" ]; then
        echo "Application directory \${timekeeper_dir} does not exist"
        return 1
    fi
    
    # Check if server.js exists
    if [ ! -f "\${timekeeper_dir}/server.js" ]; then
        echo "server.js not found in \${timekeeper_dir}"
        return 1
    fi
    
    return 0
}

timekeeper_status()
{
    if [ -e "\${pidfile}" ]; then
        pid=\$(cat "\${pidfile}")
        if ps -p "\${pid}" >/dev/null 2>&1; then
            echo "\${name} is running as pid \${pid}"
            return 0
        else
            echo "\${name} is not running (stale pid file: \${pidfile})"
            return 1
        fi
    else
        echo "\${name} is not running"
        return 1
    fi
}

timekeeper_stop()
{
    if [ -e "\${pidfile}" ]; then
        pid=\$(cat "\${pidfile}")
        echo "Stopping \${name}..."
        kill -TERM "\${pid}" 2>/dev/null
        wait_for_pids "\${pid}"
        rm -f "\${pidfile}"
    else
        echo "\${name} is not running"
    fi
}

timekeeper_restart()
{
    echo "Restarting \${name}..."
    
    # First stop the service
    timekeeper_stop
    
    # Wait a moment
    sleep 2
    
    # Start the service again
    run_rc_command "start"
    
    echo "Service restarted."
}

timekeeper_monitor()
{
    echo "Starting monitor for \${name}..."
    cd "\${timekeeper_dir}" && \${timekeeper_node} "\${timekeeper_dir}/monitor.js" > "\${timekeeper_dir}/logs/monitor.log" 2>&1 &
    echo "Monitor started. Logs at: \${timekeeper_dir}/logs/monitor.log"
}

run_rc_command "\$1"
EOL

# Install the service
echo "Installing FreeBSD service..."
cp timekeeper.rc /usr/local/etc/rc.d/timekeeper
chmod 555 /usr/local/etc/rc.d/timekeeper

# Enable the service
echo "Enabling service in /etc/rc.conf..."
sysrc timekeeper_enable="YES"
sysrc timekeeper_dir="$APP_DIR"

# Ask if user wants to start the service
echo "Do you want to start the service now? (y/n)"
read -r start_service
if [ "$start_service" = "y" ] || [ "$start_service" = "Y" ]; then
  service timekeeper start
  echo "Service started. Check status with: service timekeeper status"
  
  echo "Do you want to start the monitor as well? (y/n)"
  read -r start_monitor
  if [ "$start_monitor" = "y" ] || [ "$start_monitor" = "Y" ]; then
    service timekeeper monitor
  fi
else
  echo "Service installed but not started. Start manually with: service timekeeper start"
fi

# Get server IP for display
SERVER_IP=$(ifconfig | grep -E 'inet.[0-9]' | grep -v '127.0.0.1' | awk '{ print $2 }' | head -n 1)

echo "====================================================="
echo "DEPLOYMENT COMPLETE!"
echo "====================================================="
echo
echo "Your app is now installed at: $APP_DIR"
echo "Access your app at: http://$SERVER_IP:3000"
echo
echo "Useful commands:"
echo "- Check service status: service timekeeper status"
echo "- Restart service: service timekeeper restart"
echo "- Stop service: service timekeeper stop"
echo "- Start monitor: service timekeeper monitor"
echo "- View logs: tail -f /var/log/timekeeper.log"
echo "- View access logs: tail -f $APP_DIR/logs/access.log"
echo "- View monitor logs: tail -f $APP_DIR/logs/monitor.log"
echo
echo "====================================================="
