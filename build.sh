#!/bin/sh
# Universal build and installation script for Time Account App in TrueNAS/FreeBSD jail
# This script can be run from anywhere in the jail

set -e  # Exit on error

# Determine script location and app directory
SCRIPT_DIR=$(dirname "$(realpath "$0")")
APP_DIR=$(pwd)

echo "====================================================="
echo "TIME ACCOUNT APP BUILDER FOR TRUENAS/FREEBSD"
echo "====================================================="
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
check_dependency node nodejs || { echo "Failed to install Node.js"; exit 1; }
check_dependency npm npm || { echo "Failed to install npm"; exit 1; }

# Install Node.js dependencies
echo "Installing Node.js dependencies..."
npm install --production || { echo "Failed to install Node.js dependencies"; exit 1; }

# Create logs directory if it doesn't exist
if [ ! -d "logs" ]; then
  echo "Creating logs directory..."
  mkdir -p logs
  chmod 755 logs
fi

# Build the web application
echo "Building web application..."
mkdir -p web-build
cp -r assets web-build/ 2>/dev/null || echo "No assets directory found, skipping..."

# Create index.html with improved styling
cat > web-build/index.html << 'EOL'
<!DOCTYPE html>
<html>
<head>
  <title>Time Account App</title>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background-color: #f5f5f5; }
    .container { max-width: 800px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .header { margin-bottom: 30px; }
    .status { margin: 20px 0; padding: 15px; border-radius: 5px; background-color: #e8f5e9; }
    .endpoints { margin-top: 30px; background-color: #f5f5f5; padding: 20px; border-radius: 5px; text-align: left; }
    .endpoints ul { list-style: none; padding: 0; }
    .endpoints li { margin: 10px 0; }
    .endpoints a { display: inline-block; padding: 8px 15px; background-color: #e3f2fd; border-radius: 4px; text-decoration: none; color: #0277bd; }
    .endpoints a:hover { background-color: #bbdefb; }
    .footer { margin-top: 30px; font-size: 0.9em; color: #757575; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Time Account App</h1>
      <p>A time tracking and customer management application for freelancers and small businesses</p>
    </div>
    
    <div class="status">
      <h2>Server Status: Running</h2>
      <p>The application server is running on TrueNAS Core (FreeBSD)</p>
    </div>
    
    <div class="endpoints">
      <h3>Available Endpoints:</h3>
      <ul>
        <li><a href="/health">Health Check</a> - Check server health status</li>
        <li><a href="/server-info">Server Information</a> - View detailed server information</li>
      </ul>
    </div>
    
    <div class="footer">
      <p>To access the full application, use the mobile app or contact your administrator.</p>
      <p>Last updated: $(date +"%B %d, %Y")</p>
    </div>
  </div>
</body>
</html>
EOL

# Update the date in the HTML file
sed -i '' "s/\$(date +\"%B %d, %Y\")/$(date +"%B %d, %Y")/g" web-build/index.html

echo "Build completed. Files are in the web-build directory."

# Check if we should install the service
if [ "$(id -u)" -eq 0 ]; then
  echo "Running as root, would you like to install the FreeBSD service? (y/n)"
  read -r install_service
  if [ "$install_service" = "y" ] || [ "$install_service" = "Y" ]; then
    # Check if timekeeper.rc exists
    if [ -f "timekeeper.rc" ]; then
      echo "Installing FreeBSD service..."
      cp timekeeper.rc /usr/local/etc/rc.d/timekeeper
      chmod 555 /usr/local/etc/rc.d/timekeeper
      
      echo "Enabling service in /etc/rc.conf..."
      sysrc timekeeper_enable="YES"
      sysrc timekeeper_dir="$APP_DIR"
      
      echo "Would you like to start the service now? (y/n)"
      read -r start_service
      if [ "$start_service" = "y" ] || [ "$start_service" = "Y" ]; then
        service timekeeper start
        echo "Service started. Check status with: service timekeeper status"
      else
        echo "Service installed but not started. Start manually with: service timekeeper start"
      fi
    else
      echo "timekeeper.rc not found. Cannot install service."
    fi
  fi
else
  echo "Not running as root. To install the FreeBSD service, run this script as root."
fi

echo "====================================================="
echo "BUILD COMPLETE!"
echo "====================================================="
echo "To start the server manually: node server.js"
echo "To access the application: http://YOUR_SERVER_IP:3000"
echo "====================================================="
