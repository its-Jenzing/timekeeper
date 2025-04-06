#!/bin/sh
# Simple build script for Expo web app

echo "Building web application..."
mkdir -p web-build
cp -r assets web-build/
echo '<!DOCTYPE html>
<html>
<head>
  <title>Timekeeper App</title>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
    .container { max-width: 800px; margin: 0 auto; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Timekeeper App</h1>
    <p>Welcome to the Timekeeper application.</p>
    <p>This is a placeholder page. The full web application will be available soon.</p>
    <p>You can access the API endpoints directly:</p>
    <ul style="list-style: none; padding: 0;">
      <li><a href="/health">Health Check</a></li>
      <li><a href="/server-info">Server Information</a></li>
    </ul>
  </div>
</body>
</html>' > web-build/index.html

echo "Build completed. Files are in the web-build directory."
