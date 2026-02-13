# Troubleshooting Guide

## Issue: Cannot access main site without port 3000

### Problem
- Can access: `http://ivibe.site:3000` ✓
- Cannot access: `http://ivibe.site` ✗

### Solution

Run the fix script:
```bash
sudo ./scripts/fix-nginx.sh ivibe.site
```

Or manually:

**1. Check Nginx is running:**
```bash
sudo systemctl status nginx
```

**2. Update main Nginx config:**
```bash
sudo nano /etc/nginx/sites-available/paas
```

Make sure it has:
```nginx
server {
    listen 80;
    server_name ivibe.site www.ivibe.site;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**3. Create symlink:**
```bash
sudo ln -sf /etc/nginx/sites-available/paas /etc/nginx/sites-enabled/paas
```

**4. Remove default site:**
```bash
sudo rm /etc/nginx/sites-enabled/default
```

**5. Test and reload:**
```bash
sudo nginx -t
sudo systemctl reload nginx
```

**6. Update .env.local:**
```bash
sudo nano /opt/paas/frontend/.env.local
```

Set:
```env
DOMAIN=ivibe.site
```

**7. Restart PaaS:**
```bash
sudo systemctl restart paas
```

---

## Issue: Subdomain doesn't work after creating project

### Problem
- Created static project named "test"
- Cannot access: `http://test.ivibe.site` ✗

### Diagnosis

**1. Check if config was created:**
```bash
ls -la /etc/nginx/sites-enabled/
cat /etc/nginx/sites-enabled/test.conf
```

**2. Check Nginx logs:**
```bash
sudo tail -f /var/log/nginx/error.log
```

**3. Check PaaS logs:**
```bash
sudo journalctl -u paas -f
```

### Solution

**1. Verify DNS is configured:**
```bash
# Check wildcard DNS
dig test.ivibe.site
nslookup test.ivibe.site
```

Your DNS should have:
- `ivibe.site` → Your VPS IP
- `*.ivibe.site` → Your VPS IP (wildcard A record)

**2. Check if Nginx config was created:**
```bash
sudo ls -la /etc/nginx/sites-enabled/
```

If no `test.conf` file, the deployment might have failed.

**3. Check project status:**
```bash
# Via API
curl http://localhost:3000/api/projects

# Or check database
sqlite3 /opt/paas/data/paas.db "SELECT * FROM projects;"
```

**4. Manually create Nginx config (if missing):**
```bash
sudo nano /etc/nginx/sites-enabled/test.conf
```

For static project:
```nginx
server {
    listen 80;
    server_name test.ivibe.site;

    root /opt/paas/data/projects/test;
    index index.html index.htm;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

For serverside project (check port in database):
```nginx
server {
    listen 80;
    server_name test.ivibe.site;

    location / {
        proxy_pass http://localhost:10001;  # Use actual port
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**5. Test and reload:**
```bash
sudo nginx -t
sudo systemctl reload nginx
```

**6. Check permissions:**
```bash
# For static projects
sudo ls -la /opt/paas/data/projects/test/
sudo chmod -R 755 /opt/paas/data/projects/test/
```

---

## Common Issues

### 1. "502 Bad Gateway"

**Cause:** PaaS service not running or crashed

**Fix:**
```bash
sudo systemctl status paas
sudo journalctl -u paas -n 50
sudo systemctl restart paas
```

### 2. "404 Not Found" on subdomain

**Cause:** Nginx config not created or DNS not configured

**Fix:**
```bash
# Check DNS
dig test.ivibe.site

# Check Nginx config
ls /etc/nginx/sites-enabled/

# Redeploy project
curl -X POST http://localhost:3000/api/projects/1/deploy
```

### 3. "Permission denied" errors in logs

**Cause:** File permissions issue

**Fix:**
```bash
sudo chown -R www-data:www-data /opt/paas/data/projects/
sudo chmod -R 755 /opt/paas/data/projects/
```

### 4. Nginx won't reload

**Cause:** Configuration syntax error

**Fix:**
```bash
sudo nginx -t
# Fix the error shown
sudo systemctl reload nginx
```

### 5. Port 3000 works but domain doesn't

**Cause:** Nginx not proxying correctly

**Fix:**
```bash
# Test if Nginx is listening on port 80
sudo netstat -tlnp | grep :80

# Test proxy
curl -H "Host: ivibe.site" http://localhost

# Check Nginx is running
sudo systemctl status nginx
```

---

## Diagnostic Commands

### Check everything:
```bash
sudo ./scripts/check-nginx.sh
```

### Check service status:
```bash
sudo systemctl status paas
sudo systemctl status nginx
```

### Check logs:
```bash
# PaaS logs
sudo journalctl -u paas -f

# Nginx error log
sudo tail -f /var/log/nginx/error.log

# Nginx access log
sudo tail -f /var/log/nginx/access.log
```

### Check ports:
```bash
sudo netstat -tlnp | grep -E ":(80|3000)"
# or
sudo ss -tlnp | grep -E ":(80|3000)"
```

### Check DNS:
```bash
dig ivibe.site
dig test.ivibe.site
nslookup ivibe.site
```

### Test connectivity:
```bash
# Test main site
curl -I http://ivibe.site

# Test with Host header
curl -H "Host: ivibe.site" http://localhost

# Test subdomain
curl -I http://test.ivibe.site

# Test direct port
curl -I http://localhost:3000
```

### Check project files:
```bash
ls -la /opt/paas/data/projects/
ls -la /opt/paas/data/projects/test/
```

### Check Nginx configs:
```bash
ls -la /etc/nginx/sites-enabled/
cat /etc/nginx/sites-enabled/paas
cat /etc/nginx/sites-enabled/test.conf
```

---

## Quick Fixes

### Reset everything and start fresh:
```bash
# Stop services
sudo systemctl stop paas nginx

# Fix Nginx
sudo ./scripts/fix-nginx.sh ivibe.site

# Start services
sudo systemctl start nginx paas

# Check status
sudo systemctl status nginx paas
```

### Force recreate project config:
```bash
# Delete project
curl -X DELETE http://localhost:3000/api/projects/1

# Remove old config
sudo rm /etc/nginx/sites-enabled/test.conf

# Recreate project via UI
# Visit http://ivibe.site:3000 or http://localhost:3000
```

### Manual Nginx reload:
```bash
sudo nginx -t && sudo systemctl reload nginx
```

---

## Prevention

### Always check after deployment:
```bash
# 1. Check Nginx config was created
ls /etc/nginx/sites-enabled/

# 2. Check Nginx reloaded successfully
sudo journalctl -u nginx -n 20

# 3. Test the subdomain
curl -I http://test.ivibe.site
```

### Monitor logs during deployment:
```bash
# Terminal 1: Watch PaaS logs
sudo journalctl -u paas -f

# Terminal 2: Watch Nginx logs
sudo tail -f /var/log/nginx/error.log

# Terminal 3: Create project via UI
```

---

## Still Not Working?

1. **Run diagnostics:**
   ```bash
   sudo ./scripts/check-nginx.sh
   ```

2. **Check all logs:**
   ```bash
   sudo journalctl -u paas -n 100
   sudo tail -n 100 /var/log/nginx/error.log
   ```

3. **Verify DNS:**
   - Check your domain registrar
   - Ensure wildcard DNS is set: `*.ivibe.site`
   - Wait for DNS propagation (can take up to 24 hours)

4. **Check firewall:**
   ```bash
   sudo ufw status
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   ```

5. **Restart everything:**
   ```bash
   sudo systemctl restart docker nginx paas
   ```
