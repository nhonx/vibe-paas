#!/bin/bash

# Debug Project Deployment
# This script helps diagnose why subdomains aren't working

if [ -z "$1" ]; then
    echo "Usage: sudo ./scripts/debug-project.sh <project-name>"
    echo "Example: sudo ./scripts/debug-project.sh test"
    exit 1
fi

PROJECT_NAME="$1"
DOMAIN="${2:-ivibe.site}"

echo "=========================================="
echo "Project Deployment Debugger"
echo "=========================================="
echo "Project: $PROJECT_NAME"
echo "Domain: $DOMAIN"
echo "Expected URL: http://$PROJECT_NAME.$DOMAIN"
echo ""

# Check 1: Project exists in database
echo "1. Checking database..."
if [ -f /opt/paas/data/paas.db ]; then
    PROJECT_INFO=$(sqlite3 /opt/paas/data/paas.db "SELECT id, name, type, status, subdomain FROM projects WHERE name='$PROJECT_NAME';" 2>/dev/null)
    if [ -z "$PROJECT_INFO" ]; then
        echo "   ✗ Project '$PROJECT_NAME' not found in database"
        echo ""
        echo "Available projects:"
        sqlite3 /opt/paas/data/paas.db "SELECT name, type, status FROM projects;" 2>/dev/null
        exit 1
    else
        echo "   ✓ Project found:"
        echo "     $PROJECT_INFO"
    fi
else
    echo "   ✗ Database not found at /opt/paas/data/paas.db"
    exit 1
fi
echo ""

# Check 2: Project files exist
echo "2. Checking project files..."
PROJECT_DIR="/opt/paas/data/projects/$PROJECT_NAME"
if [ -d "$PROJECT_DIR" ]; then
    echo "   ✓ Project directory exists: $PROJECT_DIR"
    echo "   Files:"
    ls -lah "$PROJECT_DIR" | head -n 10 | sed 's/^/     /'
else
    echo "   ✗ Project directory not found: $PROJECT_DIR"
fi
echo ""

# Check 3: Nginx config exists
echo "3. Checking Nginx configuration..."
NGINX_CONFIG="/etc/nginx/sites-enabled/$PROJECT_NAME.conf"
if [ -f "$NGINX_CONFIG" ]; then
    echo "   ✓ Nginx config exists: $NGINX_CONFIG"
    echo "   Content:"
    cat "$NGINX_CONFIG" | sed 's/^/     /'
else
    echo "   ✗ Nginx config NOT found: $NGINX_CONFIG"
    echo ""
    echo "   Available configs:"
    ls -la /etc/nginx/sites-enabled/ | sed 's/^/     /'
fi
echo ""

# Check 4: Nginx syntax
echo "4. Testing Nginx configuration..."
if nginx -t 2>&1 | grep -q "successful"; then
    echo "   ✓ Nginx configuration is valid"
else
    echo "   ✗ Nginx configuration has errors:"
    nginx -t 2>&1 | sed 's/^/     /'
fi
echo ""

# Check 5: DNS resolution
echo "5. Checking DNS resolution..."
if command -v dig &> /dev/null; then
    DIG_RESULT=$(dig +short $PROJECT_NAME.$DOMAIN)
    if [ -z "$DIG_RESULT" ]; then
        echo "   ✗ DNS not resolving for $PROJECT_NAME.$DOMAIN"
    else
        echo "   ✓ DNS resolves to: $DIG_RESULT"
    fi
else
    echo "   - dig not installed, skipping DNS check"
fi
echo ""

# Check 6: Test HTTP request
echo "6. Testing HTTP request..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -H "Host: $PROJECT_NAME.$DOMAIN" http://localhost 2>/dev/null)
echo "   HTTP Status: $HTTP_CODE"
if [ "$HTTP_CODE" = "200" ]; then
    echo "   ✓ Site is responding"
elif [ "$HTTP_CODE" = "502" ]; then
    echo "   ✗ Bad Gateway - backend not running"
elif [ "$HTTP_CODE" = "404" ]; then
    echo "   ✗ Not Found - Nginx config issue or files missing"
else
    echo "   ✗ Unexpected response"
fi
echo ""

# Check 7: File permissions
echo "7. Checking file permissions..."
if [ -d "$PROJECT_DIR" ]; then
    PERMS=$(stat -c "%a %U:%G" "$PROJECT_DIR" 2>/dev/null || stat -f "%Lp %Su:%Sg" "$PROJECT_DIR" 2>/dev/null)
    echo "   Directory: $PERMS"
    
    if [ -f "$PROJECT_DIR/index.html" ]; then
        FILE_PERMS=$(stat -c "%a %U:%G" "$PROJECT_DIR/index.html" 2>/dev/null || stat -f "%Lp %Su:%Sg" "$PROJECT_DIR/index.html" 2>/dev/null)
        echo "   index.html: $FILE_PERMS"
    fi
fi
echo ""

# Check 8: Recent logs
echo "8. Recent PaaS logs (last 20 lines)..."
journalctl -u paas -n 20 --no-pager | grep -i "$PROJECT_NAME" | sed 's/^/   /' || echo "   - No recent logs for this project"
echo ""

# Check 9: Nginx error logs
echo "9. Recent Nginx errors..."
if [ -f /var/log/nginx/error.log ]; then
    tail -n 20 /var/log/nginx/error.log | grep -i "$PROJECT_NAME" | sed 's/^/   /' || echo "   - No errors for this project"
else
    echo "   - Error log not found"
fi
echo ""

# Summary and recommendations
echo "=========================================="
echo "Summary & Recommendations"
echo "=========================================="

if [ ! -f "$NGINX_CONFIG" ]; then
    echo "❌ CRITICAL: Nginx config missing!"
    echo ""
    echo "Fix:"
    echo "  1. Check PaaS logs for errors:"
    echo "     sudo journalctl -u paas -n 50 | grep -i error"
    echo ""
    echo "  2. Try redeploying:"
    echo "     curl -X POST http://localhost:3000/api/projects/\$ID/deploy"
    echo ""
    echo "  3. Manually create config:"
    echo "     sudo nano /etc/nginx/sites-enabled/$PROJECT_NAME.conf"
    echo ""
    echo "  Template for static site:"
    echo "  ----------------------------------------"
    cat <<'EOF'
  server {
      listen 80;
      server_name PROJECT_NAME.DOMAIN;
      root /opt/paas/data/projects/PROJECT_NAME;
      index index.html index.htm;
      location / {
          try_files $uri $uri/ /index.html;
      }
  }
EOF
    echo "  ----------------------------------------"
    echo ""
    echo "  Then reload: sudo nginx -s reload"
fi

if [ ! -d "$PROJECT_DIR" ]; then
    echo "❌ CRITICAL: Project files missing!"
    echo ""
    echo "Fix: Redeploy the project from the UI"
fi

if [ "$HTTP_CODE" != "200" ]; then
    echo "❌ Site not responding correctly (HTTP $HTTP_CODE)"
    echo ""
    echo "Possible causes:"
    echo "  - Nginx config incorrect"
    echo "  - File permissions wrong"
    echo "  - Files missing"
    echo "  - Backend not running (for serverside projects)"
fi

echo ""
echo "Quick test command:"
echo "  curl -v http://$PROJECT_NAME.$DOMAIN"
echo ""
echo "View live logs:"
echo "  sudo journalctl -u paas -f"
