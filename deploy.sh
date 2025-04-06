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
