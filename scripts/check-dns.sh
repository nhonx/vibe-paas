#!/bin/bash

# Check DNS Configuration
# Usage: ./check-dns.sh [subdomain]

DOMAIN="${DOMAIN:-ivibe.site}"
SUBDOMAIN="${1:-guitar}"
FULL_DOMAIN="$SUBDOMAIN.$DOMAIN"

echo "=========================================="
echo "DNS Configuration Checker"
echo "=========================================="
echo "Domain: $DOMAIN"
echo "Testing: $FULL_DOMAIN"
echo ""

# Get VPS IP
echo "1. Your VPS IP:"
VPS_IP=$(curl -s ifconfig.me 2>/dev/null || curl -s icanhazip.com 2>/dev/null || echo "Unknown")
echo "   $VPS_IP"
echo ""

# Test main domain
echo "2. Main domain ($DOMAIN):"
MAIN_IP=$(dig +short $DOMAIN | head -n 1)
if [ -z "$MAIN_IP" ]; then
    echo "   ✗ Not resolving"
else
    echo "   ✓ Resolves to: $MAIN_IP"
    if [ "$MAIN_IP" = "$VPS_IP" ]; then
        echo "   ✓ Matches VPS IP"
    else
        echo "   ⚠ Different from VPS IP"
    fi
fi
echo ""

# Test subdomain
echo "3. Subdomain ($FULL_DOMAIN):"
SUB_IP=$(dig +short $FULL_DOMAIN | head -n 1)
if [ -z "$SUB_IP" ]; then
    echo "   ✗ Not resolving (NXDOMAIN)"
    echo "   ⚠ Wildcard DNS not configured!"
else
    echo "   ✓ Resolves to: $SUB_IP"
    if [ "$SUB_IP" = "$VPS_IP" ]; then
        echo "   ✓ Matches VPS IP"
    else
        echo "   ⚠ Different from VPS IP"
    fi
fi
echo ""

# Test with Google DNS
echo "4. Google DNS (8.8.8.8):"
GOOGLE_IP=$(dig @8.8.8.8 +short $FULL_DOMAIN | head -n 1)
if [ -z "$GOOGLE_IP" ]; then
    echo "   ✗ Not resolving"
else
    echo "   ✓ Resolves to: $GOOGLE_IP"
fi
echo ""

# Test with Cloudflare DNS
echo "5. Cloudflare DNS (1.1.1.1):"
CF_IP=$(dig @1.1.1.1 +short $FULL_DOMAIN | head -n 1)
if [ -z "$CF_IP" ]; then
    echo "   ✗ Not resolving"
else
    echo "   ✓ Resolves to: $CF_IP"
fi
echo ""

# Test another random subdomain
RANDOM_SUB="test$(date +%s)"
echo "6. Random subdomain ($RANDOM_SUB.$DOMAIN):"
RANDOM_IP=$(dig +short $RANDOM_SUB.$DOMAIN | head -n 1)
if [ -z "$RANDOM_IP" ]; then
    echo "   ✗ Not resolving"
    echo "   ⚠ Wildcard definitely not working"
else
    echo "   ✓ Resolves to: $RANDOM_IP"
    echo "   ✓ Wildcard is working!"
fi
echo ""

# Test HTTP (bypass DNS)
echo "7. HTTP Test (bypass DNS):"
if command -v curl &> /dev/null; then
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -H "Host: $FULL_DOMAIN" http://localhost 2>/dev/null)
    if [ "$HTTP_CODE" = "200" ]; then
        echo "   ✓ Nginx responding (HTTP $HTTP_CODE)"
        echo "   ✓ Server is configured correctly"
    elif [ "$HTTP_CODE" = "404" ]; then
        echo "   ⚠ Nginx responding but project not found (HTTP $HTTP_CODE)"
    elif [ "$HTTP_CODE" = "502" ]; then
        echo "   ✗ Bad Gateway (HTTP $HTTP_CODE)"
    else
        echo "   ✗ Not responding correctly (HTTP $HTTP_CODE)"
    fi
else
    echo "   - curl not available"
fi
echo ""

# Summary
echo "=========================================="
echo "Summary"
echo "=========================================="

if [ -z "$SUB_IP" ]; then
    echo "❌ DNS NOT CONFIGURED"
    echo ""
    echo "Action Required:"
    echo "1. Go to your domain registrar (where you bought ivibe.site)"
    echo "2. Add DNS A record:"
    echo "   Type: A"
    echo "   Name: *"
    echo "   Value: $VPS_IP"
    echo "   TTL: 3600 (or Auto)"
    echo ""
    echo "3. Wait 5-30 minutes for DNS propagation"
    echo ""
    echo "4. Test again: ./check-dns.sh $SUBDOMAIN"
    echo ""
    echo "Meanwhile, test with Host header:"
    echo "  curl -H 'Host: $FULL_DOMAIN' http://$VPS_IP"
elif [ "$SUB_IP" != "$VPS_IP" ]; then
    echo "⚠️  DNS MISCONFIGURED"
    echo ""
    echo "Subdomain resolves to: $SUB_IP"
    echo "But VPS IP is: $VPS_IP"
    echo ""
    echo "Fix: Update DNS A record to point to $VPS_IP"
else
    echo "✅ DNS CONFIGURED CORRECTLY"
    echo ""
    echo "Your subdomain should work:"
    echo "  http://$FULL_DOMAIN"
    echo ""
    if [ "$HTTP_CODE" != "200" ]; then
        echo "But HTTP is not responding correctly."
        echo "Check Nginx configuration:"
        echo "  sudo ls -la /etc/nginx/sites-enabled/$SUBDOMAIN.conf"
        echo "  sudo nginx -t"
    fi
fi
echo ""

# Additional tests
if [ -z "$SUB_IP" ]; then
    echo "=========================================="
    echo "Detailed DNS Query"
    echo "=========================================="
    dig $FULL_DOMAIN
fi
