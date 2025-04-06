#!/bin/bash

# Build the web version
echo "Building web version..."
npm run build

# Install server dependencies if not already installed
echo "Installing server dependencies..."
npm install express compression cors

# Start the server
echo "Starting server..."
npm run serve
