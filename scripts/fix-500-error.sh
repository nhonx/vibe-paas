#!/bin/bash

# Fix 500 Internal Server Error
# This script diagnoses and fixes common causes of 500 errors

if [ -z "$1" ]; then
    echo "Usage: sudo ./scripts/fix-500-error.sh <project-name>"
    echo "Example: sudo ./scripts/fix-500-error.sh guitar"
    exit 1
fi

PROJECT_NAME="$1"
PROJECT_DIR="/opt/paas/data/projects/$PROJECT_NAME"
NGINX_CONFIG="/etc/nginx/sites-enabled/$PROJECT_NAME.conf"

echo "=========================================="
echo "Fixing 500 Error for: $PROJECT_NAME"
echo "=========================================="
echo ""

# Check 1: Project directory exists
echo "1. Checking project directory..."
if [ ! -d "$PROJECT_DIR" ]; then
    echo "   ✗ Project directory not found: $PROJECT_DIR"
    echo "   Fix: Redeploy the project"
    exit 1
fi
echo "   ✓ Directory exists: $PROJECT_DIR"
echo ""

# Check 2: Files exist
echo "2. Checking project files..."
FILE_COUNT=$(find "$PROJECT_DIR" -type f | wc -l)
echo "   Files found: $FILE_COUNT"
if [ "$FILE_COUNT" -eq 0 ]; then
    echo "   ✗ No files in project directory!"
    echo "   Fix: Redeploy the project"
    exit 1
fi

# Check for index file
if [ -f "$PROJECT_DIR/index.html" ]; then
    echo "   ✓ index.html exists"
elif [ -f "$PROJECT_DIR/index.htm" ]; then
    echo "   ✓ index.htm exists"
else
    echo "   ⚠ No index.html or index.htm found"
    echo "   Files in directory:"
    ls -lah "$PROJECT_DIR" | head -n 10 | sed 's/^/     /'
fi
echo ""

# Check 3: Permissions
echo "3. Checking permissions..."
DIR_PERMS=$(stat -c "%a" "$PROJECT_DIR" 2>/dev/null || stat -f "%Lp" "$PROJECT_DIR" 2>/dev/null)
DIR_OWNER=$(stat -c "%U:%G" "$PROJECT_DIR" 2>/dev/null || stat -f "%Su:%Sg" "$PROJECT_DIR" 2>/dev/null)
echo "   Directory: $DIR_PERMS $DIR_OWNER"

if [ "$DIR_PERMS" -lt 755 ]; then
    echo "   ⚠ Permissions too restrictive, fixing..."
    chmod -R 755 "$PROJECT_DIR"
    echo "   ✓ Fixed directory permissions"
fi

# Fix file permissions
echo "   Fixing file permissions..."
find "$PROJECT_DIR" -type d -exec chmod 755 {} \;
find "$PROJECT_DIR" -type f -exec chmod 644 {} \;
echo "   ✓ All permissions fixed"
echo ""

# Check 4: Ownership
echo "4. Checking ownership..."
if [ "$DIR_OWNER" != "root:root" ] && [ "$DIR_OWNER" != "www-data:www-data" ]; then
    echo "   ⚠ Unusual owner: $DIR_OWNER"
    echo "   Changing to www-data..."
    chown -R www-data:www-data "$PROJECT_DIR"
    echo "   ✓ Ownership changed to www-data:www-data"
else
    echo "   ✓ Ownership is correct: $DIR_OWNER"
fi
echo ""

# Check 5: Nginx config
echo "5. Checking Nginx configuration..."
if [ ! -f "$NGINX_CONFIG" ]; then
    echo "   ✗ Nginx config not found: $NGINX_CONFIG"
    exit 1
fi

echo "   Config file:"
cat "$NGINX_CONFIG" | sed 's/^/     /'
echo ""

# Check root path in config
ROOT_PATH=$(grep "root" "$NGINX_CONFIG" | awk '{print $2}' | tr -d ';')
echo "   Root path in config: $ROOT_PATH"
if [ "$ROOT_PATH" != "$PROJECT_DIR" ]; then
    echo "   ⚠ Root path mismatch!"
    echo "   Expected: $PROJECT_DIR"
    echo "   Found: $ROOT_PATH"
fi
echo ""

# Check 6: Nginx syntax
echo "6. Testing Nginx syntax..."
if nginx -t 2>&1 | grep -q "successful"; then
    echo "   ✓ Nginx config is valid"
else
    echo "   ✗ Nginx config has errors:"
    nginx -t 2>&1 | sed 's/^/     /'
fi
echo ""

# Check 7: SELinux (if applicable)
echo "7. Checking SELinux..."
if command -v getenforce &> /dev/null; then
    SELINUX_STATUS=$(getenforce)
    echo "   SELinux: $SELINUX_STATUS"
    if [ "$SELINUX_STATUS" = "Enforcing" ]; then
        echo "   ⚠ SELinux might be blocking access"
        echo "   Temporarily disable: sudo setenforce 0"
    fi
else
    echo "   - SELinux not installed"
fi
echo ""

# Check 8: Nginx error log
echo "8. Recent Nginx errors for this project..."
if [ -f /var/log/nginx/error.log ]; then
    echo "   Last 10 errors:"
    tail -n 50 /var/log/nginx/error.log | grep -i "$PROJECT_NAME" | tail -n 10 | sed 's/^/     /' || echo "   - No recent errors"
else
    echo "   - Error log not found"
fi
echo ""

# Check 9: Test HTTP
echo "9. Testing HTTP response..."
HTTP_RESPONSE=$(curl -s -o /tmp/response.html -w "%{http_code}" http://localhost -H "Host: $PROJECT_NAME.ivibe.site" 2>/dev/null)
echo "   HTTP Status: $HTTP_RESPONSE"

if [ "$HTTP_RESPONSE" = "200" ]; then
    echo "   ✓ Working now!"
elif [ "$HTTP_RESPONSE" = "500" ]; then
    echo "   ✗ Still 500 error"
    echo "   Response preview:"
    head -n 5 /tmp/response.html | sed 's/^/     /'
elif [ "$HTTP_RESPONSE" = "403" ]; then
    echo "   ✗ 403 Forbidden - Permission issue"
elif [ "$HTTP_RESPONSE" = "404" ]; then
    echo "   ✗ 404 Not Found - File missing"
fi
echo ""

# Reload Nginx
echo "10. Reloading Nginx..."
nginx -s reload
echo "   ✓ Nginx reloaded"
echo ""

# Summary
echo "=========================================="
echo "Summary"
echo "=========================================="
echo ""
echo "Actions taken:"
echo "  ✓ Fixed directory permissions (755)"
echo "  ✓ Fixed file permissions (644)"
echo "  ✓ Set ownership to www-data:www-data"
echo "  ✓ Reloaded Nginx"
echo ""
echo "Test again:"
echo "  curl http://$PROJECT_NAME.ivibe.site"
echo ""
echo "If still not working, check:"
echo "  1. Nginx error log:"
echo "     sudo tail -f /var/log/nginx/error.log"
echo ""
echo "  2. PaaS logs:"
echo "     sudo journalctl -u paas -n 50"
echo ""
echo "  3. Project files:"
echo "     ls -la $PROJECT_DIR"
echo ""
echo "  4. Try redeploying:"
echo "     curl -X POST http://localhost:3000/api/projects/\$ID/deploy"
