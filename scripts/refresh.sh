#!/bin/bash

# Refresh/Rebuild PaaS System
# This script rebuilds the app and reloads nginx without reinstalling dependencies

set -e

echo "=========================================="
echo "PaaS System Refresh"
echo "=========================================="

PROJECT_DIR="/opt/paas"

# Check if running in development or production
if [ -d "/opt/paas" ]; then
    echo "Running in production mode..."
    IS_PRODUCTION=true
else
    echo "Running in development mode..."
    IS_PRODUCTION=false
    PROJECT_DIR="$(pwd)"
fi

# Stop the service if running
if [ "$IS_PRODUCTION" = true ]; then
    echo "Stopping PaaS service..."
    systemctl stop paas || true
fi

# Navigate to frontend directory
cd $PROJECT_DIR/frontend

# Pull latest changes if git repo
if [ -d ".git" ]; then
    echo "Pulling latest changes from git..."
    git pull
fi

# Install/update npm packages
echo "Updating npm packages..."
npm install

# Rebuild the application
echo "Building application..."
npm run build

# Reload Nginx
echo "Reloading Nginx..."
if command -v nginx &> /dev/null; then
    nginx -t && nginx -s reload
    echo "Nginx reloaded successfully"
else
    echo "Nginx not found, skipping reload"
fi

# Restart the service if production
if [ "$IS_PRODUCTION" = true ]; then
    echo "Starting PaaS service..."
    systemctl start paas
    
    echo ""
    echo "Service status:"
    systemctl status paas --no-pager
fi

echo ""
echo "=========================================="
echo "Refresh Complete!"
echo "=========================================="
if [ "$IS_PRODUCTION" = true ]; then
    echo "Service restarted and Nginx reloaded"
else
    echo "Application rebuilt. Run 'npm run dev' to start"
fi
