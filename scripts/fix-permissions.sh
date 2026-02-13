#!/bin/bash

# Fix Permissions for PaaS System
# This ensures the Node.js process can write Nginx configs

set -e

echo "=========================================="
echo "Fixing PaaS Permissions"
echo "=========================================="

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "Please run as root (use sudo)"
    exit 1
fi

PROJECT_DIR="/opt/paas"

echo "1. Fixing Nginx config directory permissions..."
# Allow Node.js process to write to nginx sites-enabled
chmod 755 /etc/nginx/sites-enabled
echo "   ✓ /etc/nginx/sites-enabled is writable"

echo "2. Fixing project data directory permissions..."
mkdir -p $PROJECT_DIR/data/projects
chown -R root:root $PROJECT_DIR/data
chmod -R 755 $PROJECT_DIR/data
echo "   ✓ Data directory permissions fixed"

echo "3. Fixing existing project files..."
if [ -d "$PROJECT_DIR/data/projects" ]; then
    find $PROJECT_DIR/data/projects -type d -exec chmod 755 {} \;
    find $PROJECT_DIR/data/projects -type f -exec chmod 644 {} \;
    echo "   ✓ Project files permissions fixed"
fi

echo "4. Fixing database permissions..."
if [ -f "$PROJECT_DIR/data/paas.db" ]; then
    chmod 644 $PROJECT_DIR/data/paas.db
    echo "   ✓ Database permissions fixed"
fi

echo "5. Checking Node.js process user..."
PAAS_USER=$(ps aux | grep "npm start" | grep -v grep | awk '{print $1}' | head -n 1)
if [ -z "$PAAS_USER" ]; then
    echo "   - PaaS service not running"
else
    echo "   Running as: $PAAS_USER"
fi

echo ""
echo "=========================================="
echo "Permissions Fixed!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Restart PaaS service:"
echo "   sudo systemctl restart paas"
echo ""
echo "2. Try creating a project again"
echo ""
echo "3. Monitor logs:"
echo "   sudo journalctl -u paas -f"
