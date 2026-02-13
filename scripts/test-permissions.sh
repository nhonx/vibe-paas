#!/bin/bash

# Test if Nginx can access project files
# This simulates what Nginx does when accessing files

if [ -z "$1" ]; then
    echo "Usage: sudo ./scripts/test-permissions.sh <project-name>"
    echo "Example: sudo ./scripts/test-permissions.sh guitar"
    exit 1
fi

PROJECT_NAME="$1"

# Determine base directory
if [ -d "/opt/paas" ]; then
    BASE_DIR="/opt/paas"
else
    BASE_DIR="$(pwd)"
fi

PROJECT_DIR="$BASE_DIR/data/projects/$PROJECT_NAME"

echo "=========================================="
echo "Testing Nginx File Access"
echo "=========================================="
echo "Project: $PROJECT_NAME"
echo "Directory: $PROJECT_DIR"
echo ""

# Check if directory exists
if [ ! -d "$PROJECT_DIR" ]; then
    echo "✗ Project directory does not exist!"
    exit 1
fi

# Test as www-data user (Nginx user)
echo "1. Testing as www-data user (Nginx)..."
if id www-data &>/dev/null; then
    # Test directory access
    if sudo -u www-data test -r "$PROJECT_DIR"; then
        echo "   ✓ Can read directory"
    else
        echo "   ✗ Cannot read directory"
    fi
    
    if sudo -u www-data test -x "$PROJECT_DIR"; then
        echo "   ✓ Can execute/enter directory"
    else
        echo "   ✗ Cannot execute/enter directory"
    fi
    
    # Test file access
    if [ -f "$PROJECT_DIR/index.html" ]; then
        if sudo -u www-data test -r "$PROJECT_DIR/index.html"; then
            echo "   ✓ Can read index.html"
        else
            echo "   ✗ Cannot read index.html"
        fi
    else
        echo "   ⚠ index.html not found"
    fi
else
    echo "   ✗ www-data user does not exist!"
fi
echo ""

# Show current permissions
echo "2. Current permissions..."
ls -la "$PROJECT_DIR" | head -n 10
echo ""

# Show ownership
echo "3. Ownership..."
stat "$PROJECT_DIR" | grep -E "Uid|Gid|Access: \("
if [ -f "$PROJECT_DIR/index.html" ]; then
    stat "$PROJECT_DIR/index.html" | grep -E "Uid|Gid|Access: \("
fi
echo ""

# Show parent directory permissions
echo "4. Parent directory permissions..."
PARENT_DIR=$(dirname "$PROJECT_DIR")
ls -lad "$PARENT_DIR"
echo ""

# Test actual HTTP access
echo "5. Testing HTTP access..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -H "Host: $PROJECT_NAME.ivibe.site" http://localhost 2>/dev/null)
echo "   HTTP Status: $HTTP_CODE"

if [ "$HTTP_CODE" = "200" ]; then
    echo "   ✓ Working!"
elif [ "$HTTP_CODE" = "500" ]; then
    echo "   ✗ 500 Internal Server Error"
    echo ""
    echo "   Recent Nginx errors:"
    tail -n 10 /var/log/nginx/error.log | grep "$PROJECT_NAME"
elif [ "$HTTP_CODE" = "403" ]; then
    echo "   ✗ 403 Forbidden"
elif [ "$HTTP_CODE" = "404" ]; then
    echo "   ✗ 404 Not Found"
fi
echo ""

# Recommendations
echo "=========================================="
echo "Recommendations"
echo "=========================================="

if [ "$HTTP_CODE" != "200" ]; then
    echo ""
    echo "To fix permissions, run:"
    echo "  sudo find $PROJECT_DIR -type d -exec chmod 755 {} \\;"
    echo "  sudo find $PROJECT_DIR -type f -exec chmod 644 {} \\;"
    echo "  sudo chown -R www-data:www-data $PROJECT_DIR"
    echo "  sudo nginx -s reload"
    echo ""
    echo "Or use the automated script:"
    echo "  sudo ./scripts/fix-500-error.sh $PROJECT_NAME"
fi
