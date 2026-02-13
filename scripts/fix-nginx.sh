#!/bin/bash

# Fix Nginx Configuration
# This script helps diagnose and fix Nginx issues

set -e

echo "=========================================="
echo "Nginx Configuration Fix"
echo "=========================================="

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "Please run as root (use sudo)"
    exit 1
fi

PROJECT_DIR="/opt/paas"
DOMAIN="${1:-ivibe.site}"

echo "Domain: $DOMAIN"
echo ""

# Step 1: Check if Nginx is installed
echo "1. Checking Nginx installation..."
if ! command -v nginx &> /dev/null; then
    echo "ERROR: Nginx is not installed!"
    echo "Install with: sudo apt-get install nginx"
    exit 1
fi
echo "   ✓ Nginx is installed"

# Step 2: Check if Nginx is running
echo "2. Checking Nginx status..."
if systemctl is-active --quiet nginx; then
    echo "   ✓ Nginx is running"
else
    echo "   ✗ Nginx is not running. Starting..."
    systemctl start nginx
fi

# Step 3: Update main config with correct domain
echo "3. Updating main Nginx configuration..."
cat > /etc/nginx/sites-available/paas <<EOF
# Main PaaS configuration for $DOMAIN

# Main application
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF
echo "   ✓ Main config created"

# Step 4: Create symlink
echo "4. Creating symlink..."
ln -sf /etc/nginx/sites-available/paas /etc/nginx/sites-enabled/paas
echo "   ✓ Symlink created"

# Step 5: Remove default site if it exists
echo "5. Removing default site..."
if [ -f /etc/nginx/sites-enabled/default ]; then
    rm /etc/nginx/sites-enabled/default
    echo "   ✓ Default site removed"
else
    echo "   - Default site not found (OK)"
fi

# Step 6: Update environment variable
echo "6. Updating .env.local..."
if [ -f "$PROJECT_DIR/frontend/.env.local" ]; then
    # Update or add DOMAIN
    if grep -q "^DOMAIN=" "$PROJECT_DIR/frontend/.env.local"; then
        sed -i "s/^DOMAIN=.*/DOMAIN=$DOMAIN/" "$PROJECT_DIR/frontend/.env.local"
    else
        echo "DOMAIN=$DOMAIN" >> "$PROJECT_DIR/frontend/.env.local"
    fi
    echo "   ✓ .env.local updated"
else
    echo "   ✗ .env.local not found"
fi

# Step 7: Create directory for project configs
echo "7. Setting up project config directory..."
mkdir -p /etc/nginx/conf.d/paas-projects
echo "   ✓ Directory created"

# Step 8: Test Nginx configuration
echo "8. Testing Nginx configuration..."
if nginx -t; then
    echo "   ✓ Nginx config is valid"
else
    echo "   ✗ Nginx config has errors!"
    exit 1
fi

# Step 9: Reload Nginx
echo "9. Reloading Nginx..."
systemctl reload nginx
echo "   ✓ Nginx reloaded"

# Step 10: Restart PaaS service
echo "10. Restarting PaaS service..."
systemctl restart paas
echo "   ✓ PaaS service restarted"

# Step 11: Check status
echo ""
echo "=========================================="
echo "Configuration Complete!"
echo "=========================================="
echo ""
echo "Nginx Status:"
systemctl status nginx --no-pager | head -n 5
echo ""
echo "PaaS Status:"
systemctl status paas --no-pager | head -n 5
echo ""
echo "=========================================="
echo "Next Steps:"
echo "=========================================="
echo "1. Verify DNS is configured:"
echo "   - $DOMAIN → Your VPS IP"
echo "   - *.$DOMAIN → Your VPS IP (wildcard)"
echo ""
echo "2. Test main site:"
echo "   curl -H \"Host: $DOMAIN\" http://localhost"
echo "   or visit: http://$DOMAIN"
echo ""
echo "3. Check Nginx logs if issues:"
echo "   sudo tail -f /var/log/nginx/error.log"
echo ""
echo "4. Check PaaS logs:"
echo "   sudo journalctl -u paas -f"
echo ""
echo "5. After creating a project, check its config:"
echo "   ls -la /etc/nginx/sites-enabled/"
echo "   cat /etc/nginx/sites-enabled/<project-name>.conf"
