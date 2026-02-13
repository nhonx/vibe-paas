#!/bin/bash

# Quick Restart - Just restart the service without rebuilding

set -e

echo "Quick restarting PaaS service..."

# Check if running in production
if [ -d "/opt/paas" ]; then
    # Production mode
    systemctl restart paas
    echo "Service restarted"
    echo ""
    systemctl status paas --no-pager
else
    # Development mode
    echo "Development mode detected."
    echo "Please stop the dev server (Ctrl+C) and run: npm run dev"
fi
