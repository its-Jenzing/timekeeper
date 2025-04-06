#!/bin/bash

# Set up environment
echo "Setting up environment..."
# Install Node.js dependencies
npm install

# Build the web version
echo "Building web version..."
npm run build

# Check if web-build directory exists
if [ ! -d "web-build" ]; then
  echo "Error: web-build directory not found. Build may have failed."
  exit 1
fi

# Install server dependencies if not already installed
echo "Installing server dependencies..."
npm install express compression cors

# Create a systemd service file for persistent running
echo "Creating service file for persistent running..."
cat > time-account-app.service << EOL
[Unit]
Description=Time Account App Server
After=network.target

[Service]
WorkingDirectory=$(pwd)
ExecStart=$(which node) server.js
Restart=always
User=$(whoami)
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
EOL

echo "====================================================="
echo "DEPLOYMENT INSTRUCTIONS:"
echo "====================================================="
echo "1. Copy this app to your TrueNAS jail"
echo "   (Use SCP or Git clone from your repository)"
echo "   For Git setup instructions, run: ./git-setup.sh"
echo ""
echo "2. Inside the jail, navigate to the app directory and run:"
echo "   chmod +x deploy.sh"
echo "   ./deploy.sh"
echo ""
echo "3. For persistent running, copy the service file to systemd:"
echo "   cp time-account-app.service /etc/systemd/system/"
echo "   systemctl enable time-account-app"
echo "   systemctl start time-account-app"
echo ""
echo "4. If systemd is not available in your jail, use this command to keep the app running:"
echo "   nohup node server.js > app.log 2>&1 &"
echo ""
echo "5. Access your app at: http://YOUR_JAIL_IP:3000"
echo "====================================================="

# Start the server
echo "Starting server in foreground mode..."
node server.js
#!/bin/bash

echo "====================================================="
echo "TIMEKEEPER DEPLOYMENT SCRIPT FOR TRUENAS CORE JAIL"
echo "====================================================="
echo "This script will:"
echo "1. Check for required dependencies"
echo "2. Clone the repository from GitHub"
echo "3. Install Node.js dependencies"
echo "4. Build the web version"
echo "5. Set up the server"
echo "6. Configure for persistent running"
echo "====================================================="
echo

# Check for required dependencies
check_dependency() {
  if ! command -v $1 &> /dev/null; then
    echo "$1 is not installed. Installing..."
    if command -v pkg &> /dev/null; then
      # FreeBSD package manager (TrueNAS Core uses FreeBSD)
      pkg install -y $2
    elif command -v apt &> /dev/null; then
      # Debian/Ubuntu package manager
      apt update
      apt install -y $2
    else
      echo "ERROR: Could not determine package manager. Please install $1 manually."
      exit 1
    fi
  else
    echo "$1 is already installed."
  fi
}

# Check and install dependencies
check_dependency git git
check_dependency node nodejs
check_dependency npm npm

echo "All required dependencies are installed."
echo

# Create deployment directory
DEPLOY_DIR="timekeeper-app"
if [ -d "$DEPLOY_DIR" ]; then
  echo "The directory $DEPLOY_DIR already exists."
  read -p "Do you want to overwrite it? (y/n): " OVERWRITE
  if [ "$OVERWRITE" != "y" ] && [ "$OVERWRITE" != "Y" ]; then
    echo "Deployment cancelled."
    exit 0
  fi
  echo "Removing existing directory..."
  rm -rf "$DEPLOY_DIR"
fi

echo "Creating deployment directory..."
mkdir -p "$DEPLOY_DIR"
cd "$DEPLOY_DIR"

# Clone the repository
echo "Cloning repository from GitHub..."
git clone -b alpha_1.0 https://github.com/its-Jenzing/timekeeper.git .
if [ $? -ne 0 ]; then
  echo "Failed to clone repository."
  cd ..
  exit 1
fi

# Install dependencies
echo "Installing Node.js dependencies..."
npm install
if [ $? -ne 0 ]; then
  echo "Failed to install dependencies."
  cd ..
  exit 1
fi

# Create server.js if it doesn't exist
if [ ! -f "server.js" ]; then
  echo "Creating server.js file..."
  cat > server.js << 'EOL'
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
EOL
fi

# Update package.json to include server dependencies and scripts
echo "Updating package.json with server dependencies and scripts..."
npm install --save express compression cors
npm install --save-dev @babel/core @types/react typescript

# Add build and serve scripts to package.json if they don't exist
# Using node to modify package.json
node -e "
const fs = require('fs');
const packageJson = JSON.parse(fs.readFileSync('./package.json'));
packageJson.scripts = packageJson.scripts || {};
if (!packageJson.scripts.build) packageJson.scripts.build = 'expo export:web';
if (!packageJson.scripts.serve) packageJson.scripts.serve = 'node server.js';
fs.writeFileSync('./package.json', JSON.stringify(packageJson, null, 2));
"

# Build the web version
echo "Building web version..."
npm run build

# Check if web-build directory exists
if [ ! -d "web-build" ]; then
  echo "Error: web-build directory not found. Build may have failed."
  exit 1
fi

# Create a service file for persistent running
echo "Creating service file for persistent running..."
cat > timekeeper-app.service << EOL
[Unit]
Description=Timekeeper App Server
After=network.target

[Service]
WorkingDirectory=$(pwd)
ExecStart=$(which node) server.js
Restart=always
User=$(whoami)
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
EOL

# Create a rc.d script for FreeBSD (TrueNAS Core)
echo "Creating rc.d script for FreeBSD..."
cat > /usr/local/etc/rc.d/timekeeper << EOL
#!/bin/sh
#
# PROVIDE: timekeeper
# REQUIRE: NETWORKING
# KEYWORD: shutdown
#
# Add the following lines to /etc/rc.conf to enable timekeeper:
# timekeeper_enable="YES"

. /etc/rc.subr

name="timekeeper"
rcvar="timekeeper_enable"

load_rc_config \$name

: \${timekeeper_enable:="NO"}
: \${timekeeper_user:="$(whoami)"}
: \${timekeeper_group:="$(id -gn)"}
: \${timekeeper_chdir:="$(pwd)"}

pidfile="/var/run/\${name}.pid"
command="/usr/sbin/daemon"
command_args="-P \${pidfile} -r -f -u \${timekeeper_user} $(which node) \${timekeeper_chdir}/server.js"

run_rc_command "\$1"
EOL

# Make the rc.d script executable
chmod +x /usr/local/etc/rc.d/timekeeper

echo "====================================================="
echo "DEPLOYMENT COMPLETE!"
echo "====================================================="
echo
echo "To start the server now, run:"
echo "node server.js"
echo
echo "For persistent running on TrueNAS Core (FreeBSD):"
echo "1. Enable the service in /etc/rc.conf:"
echo "   echo 'timekeeper_enable=\"YES\"' >> /etc/rc.conf"
echo
echo "2. Start the service:"
echo "   service timekeeper start"
echo
echo "3. Check the status:"
echo "   service timekeeper status"
echo
echo "Your app will be accessible at:"
echo "http://YOUR_JAIL_IP:3000"
echo
echo "====================================================="
