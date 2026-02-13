#!/bin/bash

# Check Nginx Configuration and Status

echo "=========================================="
echo "Nginx Diagnostics"
echo "=========================================="
echo ""

# Check if Nginx is installed
echo "1. Nginx Installation:"
if command -v nginx &> /dev/null; then
    nginx -v
else
    echo "   ✗ Nginx is NOT installed"
    exit 1
fi
echo ""

# Check if Nginx is running
echo "2. Nginx Status:"
if systemctl is-active --quiet nginx; then
    echo "   ✓ Running"
else
    echo "   ✗ Not running"
fi
echo ""

# Check main config
echo "3. Main PaaS Config:"
if [ -f /etc/nginx/sites-enabled/paas ]; then
    echo "   ✓ /etc/nginx/sites-enabled/paas exists"
    echo "   Server names:"
    grep "server_name" /etc/nginx/sites-enabled/paas | head -n 1
else
    echo "   ✗ Main config not found"
fi
echo ""

# Check project configs
echo "4. Project Configs:"
PROJECT_CONFIGS=$(find /etc/nginx/sites-enabled -name "*.conf" -type f 2>/dev/null | grep -v paas || echo "")
if [ -z "$PROJECT_CONFIGS" ]; then
    echo "   - No project configs found"
else
    echo "$PROJECT_CONFIGS" | while read config; do
        echo "   ✓ $(basename $config)"
        grep "server_name" "$config" | head -n 1 | sed 's/^/     /'
    done
fi
echo ""

# Test config
echo "5. Configuration Test:"
if nginx -t 2>&1 | grep -q "successful"; then
    echo "   ✓ Configuration is valid"
else
    echo "   ✗ Configuration has errors:"
    nginx -t 2>&1 | sed 's/^/     /'
fi
echo ""

# Check ports
echo "6. Listening Ports:"
netstat -tlnp 2>/dev/null | grep nginx || ss -tlnp 2>/dev/null | grep nginx || echo "   - Could not check ports"
echo ""

# Check if port 3000 is in use
echo "7. PaaS Service (port 3000):"
if netstat -tlnp 2>/dev/null | grep -q ":3000" || ss -tlnp 2>/dev/null | grep -q ":3000"; then
    echo "   ✓ Service running on port 3000"
else
    echo "   ✗ Nothing listening on port 3000"
fi
echo ""

# Check DNS resolution
echo "8. DNS Check:"
DOMAIN=$(grep "^DOMAIN=" /opt/paas/frontend/.env.local 2>/dev/null | cut -d'=' -f2 || echo "ivibe.site")
echo "   Domain: $DOMAIN"
if host $DOMAIN &>/dev/null; then
    echo "   DNS: $(host $DOMAIN | head -n 1)"
else
    echo "   ✗ DNS not resolving"
fi
echo ""

# Recent errors
echo "9. Recent Nginx Errors:"
if [ -f /var/log/nginx/error.log ]; then
    tail -n 5 /var/log/nginx/error.log | sed 's/^/   /'
else
    echo "   - No error log found"
fi
echo ""

echo "=========================================="
echo "Quick Tests:"
echo "=========================================="
echo "Test main site:"
echo "  curl -H 'Host: $DOMAIN' http://localhost"
echo ""
echo "Test with port 3000 directly:"
echo "  curl http://localhost:3000"
echo ""
echo "View live logs:"
echo "  sudo tail -f /var/log/nginx/error.log"
echo "  sudo journalctl -u paas -f"
