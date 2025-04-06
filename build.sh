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
    pkg install -y "$2" || pkg install -y "$1"
    
    # Verify installation was successful
    if ! command -v "$1" > /dev/null 2>&1; then
      # Try alternative package names
      echo "Trying alternative package for $1..."
      if [ "$1" = "node" ]; then
        pkg install -y node22
      elif [ "$1" = "npm" ]; then
        pkg install -y npm-node22
      fi
      
      # Final check
      if ! command -v "$1" > /dev/null 2>&1; then
        return 1
      fi
    fi
    return 0
  else
    echo "$1 is already installed."
    return 0
  fi
}

echo "Checking dependencies..."
check_dependency node node || { echo "Failed to install Node.js"; exit 1; }
check_dependency npm npm || { echo "Failed to install npm"; exit 1; }

# Make sure PATH includes /usr/local/bin where node is likely installed
export PATH="/usr/local/bin:$PATH"

# Debug information about Node.js installation
echo "Node.js information:"
echo "Node path: $(which node 2>/dev/null || echo 'Not found in PATH')"
echo "Node version: $(node --version 2>/dev/null || echo 'Cannot determine version')"
echo "Node locations:"
for path in /usr/bin/node /usr/local/bin/node /usr/local/bin/node22
do
  if [ -x "$path" ]; then
    echo "  - $path (executable)"
  elif [ -e "$path" ]; then
    echo "  - $path (exists but not executable)"
  else
    echo "  - $path (not found)"
  fi
done

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

# Create app.html for the interactive application
cat > web-build/app.html << 'EOL'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Time Account App</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      margin: 0;
      padding: 0;
      background-color: #f5f5f5;
      color: #333;
    }
    header {
      background-color: #3f51b5;
      color: white;
      padding: 1rem;
      text-align: center;
    }
    nav {
      background-color: #303f9f;
      padding: 0.5rem;
    }
    nav ul {
      list-style-type: none;
      margin: 0;
      padding: 0;
      display: flex;
      justify-content: center;
    }
    nav li {
      margin: 0 1rem;
    }
    nav a {
      color: white;
      text-decoration: none;
      padding: 0.5rem;
    }
    nav a:hover {
      background-color: rgba(255, 255, 255, 0.1);
      border-radius: 4px;
    }
    main {
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }
    .card {
      background-color: white;
      border-radius: 4px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
      padding: 1.5rem;
      margin-bottom: 1.5rem;
    }
    .dashboard {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }
    .stat-card {
      background-color: white;
      border-radius: 4px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
      padding: 1.5rem;
      text-align: center;
    }
    .stat-card h3 {
      margin-top: 0;
      color: #555;
    }
    .stat-card .value {
      font-size: 2.5rem;
      font-weight: bold;
      color: #3f51b5;
      margin: 1rem 0;
    }
    .time-tracker {
      background-color: white;
      border-radius: 4px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
      padding: 1.5rem;
      margin-bottom: 1.5rem;
    }
    .timer {
      font-size: 3rem;
      font-weight: bold;
      text-align: center;
      margin: 1.5rem 0;
      color: #3f51b5;
    }
    .timer-controls {
      display: flex;
      justify-content: center;
      gap: 1rem;
    }
    button {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: bold;
      transition: background-color 0.2s;
    }
    .start-btn {
      background-color: #4CAF50;
      color: white;
    }
    .start-btn:hover {
      background-color: #45a049;
    }
    .stop-btn {
      background-color: #f44336;
      color: white;
    }
    .stop-btn:hover {
      background-color: #d32f2f;
    }
    .pause-btn {
      background-color: #ff9800;
      color: white;
    }
    .pause-btn:hover {
      background-color: #f57c00;
    }
    .entries-list {
      margin-top: 2rem;
    }
    .entry {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      border-bottom: 1px solid #eee;
    }
    .entry:last-child {
      border-bottom: none;
    }
    .entry-description {
      flex-grow: 1;
    }
    .entry-time {
      font-weight: bold;
      color: #3f51b5;
    }
    .entry-date {
      color: #777;
      font-size: 0.9rem;
    }
    footer {
      background-color: #303f9f;
      color: white;
      text-align: center;
      padding: 1rem;
      margin-top: 2rem;
    }
    .hidden {
      display: none;
    }
    #project-input, #description-input {
      width: 100%;
      padding: 0.75rem;
      margin-bottom: 1rem;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
    .home-link {
      display: inline-block;
      margin-top: 1rem;
      color: #3f51b5;
      text-decoration: none;
    }
    .home-link:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <header>
    <h1>Time Account App</h1>
    <p>Track your time, manage your customers, and boost your productivity</p>
  </header>
  
  <nav>
    <ul>
      <li><a href="#dashboard" class="nav-link" data-section="dashboard-section">Dashboard</a></li>
      <li><a href="#timetracking" class="nav-link" data-section="timetracking-section">Time Tracking</a></li>
      <li><a href="#customers" class="nav-link" data-section="customers-section">Customers</a></li>
      <li><a href="#reports" class="nav-link" data-section="reports-section">Reports</a></li>
    </ul>
  </nav>
  
  <main>
    <section id="dashboard-section">
      <h2>Dashboard</h2>
      
      <div class="dashboard">
        <div class="stat-card">
          <h3>Hours This Week</h3>
          <div class="value">24.5</div>
        </div>
        
        <div class="stat-card">
          <h3>Active Projects</h3>
          <div class="value">3</div>
        </div>
        
        <div class="stat-card">
          <h3>Customers</h3>
          <div class="value">5</div>
        </div>
      </div>
      
      <div class="card">
        <h3>Recent Activity</h3>
        <div class="entries-list">
          <div class="entry">
            <div class="entry-description">
              <strong>Website Development</strong> - Homepage redesign
              <div class="entry-date">Today, 10:30 AM</div>
            </div>
            <div class="entry-time">2h 15m</div>
          </div>
          
          <div class="entry">
            <div class="entry-description">
              <strong>Mobile App</strong> - Bug fixes
              <div class="entry-date">Yesterday, 3:45 PM</div>
            </div>
            <div class="entry-time">1h 30m</div>
          </div>
          
          <div class="entry">
            <div class="entry-description">
              <strong>Client Meeting</strong> - Project planning
              <div class="entry-date">Yesterday, 9:00 AM</div>
            </div>
            <div class="entry-time">45m</div>
          </div>
        </div>
      </div>
    </section>
    
    <section id="timetracking-section" class="hidden">
      <h2>Time Tracking</h2>
      
      <div class="time-tracker">
        <div>
          <label for="project-input">Project:</label>
          <input type="text" id="project-input" placeholder="Enter project name">
        </div>
        
        <div>
          <label for="description-input">Description:</label>
          <input type="text" id="description-input" placeholder="What are you working on?">
        </div>
        
        <div class="timer" id="timer">00:00:00</div>
        
        <div class="timer-controls">
          <button id="start-timer" class="start-btn">Start</button>
          <button id="pause-timer" class="pause-btn" disabled>Pause</button>
          <button id="stop-timer" class="stop-btn" disabled>Stop</button>
        </div>
      </div>
      
      <div class="card">
        <h3>Today's Entries</h3>
        <div class="entries-list" id="today-entries">
          <!-- Entries will be added here dynamically -->
        </div>
      </div>
    </section>
    
    <section id="customers-section" class="hidden">
      <h2>Customers</h2>
      
      <div class="card">
        <h3>Customer List</h3>
        <p>This is where you would manage your customer information.</p>
        <p>Features would include:</p>
        <ul>
          <li>Adding new customers</li>
          <li>Editing customer details</li>
          <li>Viewing customer history</li>
          <li>Managing customer projects</li>
        </ul>
      </div>
    </section>
    
    <section id="reports-section" class="hidden">
      <h2>Reports</h2>
      
      <div class="card">
        <h3>Time Reports</h3>
        <p>This is where you would generate and view reports.</p>
        <p>Report types would include:</p>
        <ul>
          <li>Weekly time summaries</li>
          <li>Project-based reports</li>
          <li>Customer billing reports</li>
          <li>Productivity analysis</li>
        </ul>
      </div>
    </section>
    
    <a href="/" class="home-link">← Back to Home</a>
  </main>
  
  <footer>
    <p>&copy; 2025 Time Account App | Running on TrueNAS Core</p>
  </footer>
  
  <script>
    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Hide all sections
        document.querySelectorAll('main > section').forEach(section => {
          section.classList.add('hidden');
        });
        
        // Show the selected section
        const sectionId = this.getAttribute('data-section');
        document.getElementById(sectionId).classList.remove('hidden');
      });
    });
    
    // Timer functionality
    let timerInterval;
    let seconds = 0;
    let isRunning = false;
    let isPaused = false;
    
    const timerDisplay = document.getElementById('timer');
    const startButton = document.getElementById('start-timer');
    const pauseButton = document.getElementById('pause-timer');
    const stopButton = document.getElementById('stop-timer');
    const projectInput = document.getElementById('project-input');
    const descriptionInput = document.getElementById('description-input');
    const todayEntries = document.getElementById('today-entries');
    
    startButton.addEventListener('click', function() {
      if (!projectInput.value) {
        alert('Please enter a project name');
        return;
      }
      
      if (isPaused) {
        // Resume timer
        isPaused = false;
        this.disabled = true;
        pauseButton.disabled = false;
      } else {
        // Start new timer
        seconds = 0;
        updateTimerDisplay();
      }
      
      isRunning = true;
      this.disabled = true;
      pauseButton.disabled = false;
      stopButton.disabled = false;
      
      timerInterval = setInterval(function() {
        seconds++;
        updateTimerDisplay();
      }, 1000);
    });
    
    pauseButton.addEventListener('click', function() {
      clearInterval(timerInterval);
      isRunning = false;
      isPaused = true;
      this.disabled = true;
      startButton.disabled = false;
    });
    
    stopButton.addEventListener('click', function() {
      if (!isRunning && !isPaused) return;
      
      clearInterval(timerInterval);
      
      // Add entry to today's list
      const entry = document.createElement('div');
      entry.className = 'entry';
      entry.innerHTML = `
        <div class="entry-description">
          <strong>${projectInput.value}</strong> - ${descriptionInput.value || 'No description'}
          <div class="entry-date">Today, ${new Date().toLocaleTimeString()}</div>
        </div>
        <div class="entry-time">${formatTime(seconds)}</div>
      `;
      todayEntries.prepend(entry);
      
      // Reset timer and inputs
      seconds = 0;
      updateTimerDisplay();
      isRunning = false;
      isPaused = false;
      this.disabled = true;
      pauseButton.disabled = true;
      startButton.disabled = false;
      projectInput.value = '';
      descriptionInput.value = '';
    });
    
    function updateTimerDisplay() {
      timerDisplay.textContent = formatTime(seconds);
    }
    
    function formatTime(totalSeconds) {
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      
      return [hours, minutes, seconds]
        .map(v => v < 10 ? "0" + v : v)
        .join(":");
    }
    
    // Show dashboard by default
    document.getElementById('dashboard-section').classList.remove('hidden');
  </script>
</body>
</html>
EOL

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
      
      # Find node executable path with more robust detection
      NODE_PATH=$(which node 2>/dev/null)
      if [ -n "$NODE_PATH" ] && [ -x "$NODE_PATH" ]; then
        echo "Setting node path to $NODE_PATH in rc.conf..."
        sysrc timekeeper_node="$NODE_PATH"
      else
        # Try to find node in common locations
        for path in /usr/local/bin/node /usr/bin/node /usr/local/bin/node22
        do
          if [ -x "$path" ]; then
            echo "Found Node.js at $path, setting in rc.conf..."
            sysrc timekeeper_node="$path"
            break
          fi
        done
      fi
      
      # Create a symlink to ensure node is found in the expected location
      if [ ! -e "/usr/local/bin/node" ] && [ -x "/usr/local/bin/node22" ]; then
        echo "Creating symlink from node22 to node..."
        ln -sf /usr/local/bin/node22 /usr/local/bin/node
      fi
      
      echo "Would you like to start the service now? (y/n)"
      read -r start_service
      if [ "$start_service" = "y" ] || [ "$start_service" = "Y" ]; then
        echo "Starting service..."
        service timekeeper start
        sleep 2
        if service timekeeper status | grep -q "is running"; then
          echo "Service started successfully. Check status with: service timekeeper status"
        else
          echo "Service may have failed to start. Check logs with: cat /var/log/timekeeper.log"
          echo "You can also try running the server manually with: node $APP_DIR/server.js"
        fi
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
