# Subdomain Not Working - Complete Fix

## The Problem
DNS is configured with wildcard A record, but subdomains still don't work after creating projects.

## Most Likely Causes

1. **Permission Issue** - Node.js can't write to `/etc/nginx/sites-enabled/`
2. **Nginx Config Not Created** - Deployment succeeds but config file missing
3. **Nginx Not Reloading** - Config created but Nginx didn't reload

---

## Step-by-Step Fix

### Step 1: Run on Your VPS

```bash
cd /opt/paas
chmod +x scripts/*.sh

# Fix permissions
sudo ./scripts/fix-permissions.sh

# Rebuild with better logging
sudo ./scripts/refresh.sh
```

### Step 2: Check Current State

```bash
# Check if any project exists
curl http://localhost:3000/api/projects

# If you have a project, check its config
sudo ls -la /etc/nginx/sites-enabled/

# You should see: paas (main) and yourproject.conf
```

### Step 3: Debug a Specific Project

```bash
# Replace 'test' with your project name
sudo ./scripts/debug-project.sh test
```

This will show you exactly what's wrong.

---

## Manual Fix (If Scripts Don't Work)

### Check 1: Verify DNS
```bash
dig test.ivibe.site
# Should return your VPS IP
```

### Check 2: Look at Logs During Deployment

**Terminal 1 - Watch logs:**
```bash
sudo journalctl -u paas -f
```

**Terminal 2 - Create project via UI**
Go to http://ivibe.site:3000 and create a project

**What to look for in logs:**
- ✅ "Creating static Nginx config for test.ivibe.site"
- ✅ "Config file written: /etc/nginx/sites-enabled/test.conf"
- ✅ "Nginx reloaded successfully"
- ❌ "Permission denied" → Run fix-permissions.sh
- ❌ "Nginx reload failed" → Check nginx -t

### Check 3: Manually Verify Config

```bash
# Check if config exists
sudo cat /etc/nginx/sites-enabled/test.conf

# If missing, check permissions
ls -la /etc/nginx/sites-enabled/
# Should show: drwxr-xr-x (755)

# Check if Node.js can write there
sudo -u root touch /etc/nginx/sites-enabled/test-write-test
# If this fails, permissions are wrong
sudo rm /etc/nginx/sites-enabled/test-write-test
```

### Check 4: Manually Create Config (Temporary Fix)

If config is missing, create it manually:

```bash
sudo nano /etc/nginx/sites-enabled/test.conf
```

Paste this (adjust project name and domain):

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

Then:
```bash
sudo nginx -t
sudo nginx -s reload
```

Test:
```bash
curl http://test.ivibe.site
```

---

## Common Issues & Solutions

### Issue 1: "Permission denied" in logs

**Fix:**
```bash
sudo ./scripts/fix-permissions.sh
sudo systemctl restart paas
```

### Issue 2: Config created but subdomain returns 404

**Check file permissions:**
```bash
sudo ls -la /opt/paas/data/projects/test/
```

**Fix:**
```bash
sudo chmod -R 755 /opt/paas/data/projects/test/
sudo chown -R www-data:www-data /opt/paas/data/projects/test/
```

### Issue 3: Nginx test fails

**Check syntax:**
```bash
sudo nginx -t
```

**If errors, check all configs:**
```bash
sudo cat /etc/nginx/sites-enabled/*.conf
```

**Remove bad config:**
```bash
sudo rm /etc/nginx/sites-enabled/bad-project.conf
sudo nginx -s reload
```

### Issue 4: DNS not resolving

**Test DNS:**
```bash
dig test.ivibe.site
nslookup test.ivibe.site
```

**If not resolving:**
- Check your domain registrar DNS settings
- Ensure wildcard record exists: `*.ivibe.site` → Your IP
- Wait 5-30 minutes for propagation
- Try flushing local DNS: `sudo systemd-resolve --flush-caches`

---

## Testing Checklist

After running fixes, test each step:

### 1. Main Site
```bash
curl -I http://ivibe.site
# Should return 200 OK
```

### 2. Create Test Project

Via UI or API:
```bash
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "name": "test",
    "type": "static",
    "source_type": "github",
    "source_path": "https://github.com/vercel/next.js.git"
  }'
```

### 3. Deploy It
```bash
# Get project ID from previous response
curl -X POST http://localhost:3000/api/projects/1/deploy
```

### 4. Watch Deployment
```bash
sudo journalctl -u paas -f
```

Look for:
- ✅ "Created Nginx config for test"
- ✅ "Config file written"
- ✅ "Nginx reloaded successfully"

### 5. Verify Config Created
```bash
sudo ls -la /etc/nginx/sites-enabled/test.conf
sudo cat /etc/nginx/sites-enabled/test.conf
```

### 6. Test Subdomain
```bash
# Test with curl
curl -I http://test.ivibe.site

# Test with Host header (bypasses DNS)
curl -H "Host: test.ivibe.site" http://localhost
```

### 7. Test in Browser
Open: `http://test.ivibe.site`

---

## Still Not Working?

### Get Complete Diagnostics

```bash
# 1. Check everything
sudo ./scripts/check-nginx.sh > check-report.txt

# 2. Debug specific project
sudo ./scripts/debug-project.sh test > debug-report.txt

# 3. Get logs
sudo journalctl -u paas -n 100 > paas-logs.txt
sudo tail -n 100 /var/log/nginx/error.log > nginx-logs.txt

# 4. List all files
ls -laR /etc/nginx/sites-enabled/ > nginx-configs.txt
ls -laR /opt/paas/data/projects/ > project-files.txt

# 5. Review all reports
cat check-report.txt
cat debug-report.txt
cat paas-logs.txt
cat nginx-logs.txt
```

Share these reports for further help.

---

## Prevention

### Always Monitor During Deployment

```bash
# Terminal 1: PaaS logs
sudo journalctl -u paas -f

# Terminal 2: Nginx logs  
sudo tail -f /var/log/nginx/error.log

# Terminal 3: Create project
```

### Verify After Each Deployment

```bash
# Quick check script
PROJECT_NAME="test"
echo "Checking $PROJECT_NAME..."
ls -la /etc/nginx/sites-enabled/$PROJECT_NAME.conf && \
curl -I http://$PROJECT_NAME.ivibe.site && \
echo "✓ All good!" || echo "✗ Something wrong"
```

---

## Quick Reference

```bash
# Fix permissions and rebuild
sudo ./scripts/fix-permissions.sh
sudo ./scripts/refresh.sh

# Debug a project
sudo ./scripts/debug-project.sh <project-name>

# Check Nginx
sudo ./scripts/check-nginx.sh

# Watch logs
sudo journalctl -u paas -f

# Test subdomain
curl -H "Host: test.ivibe.site" http://localhost

# Manually reload Nginx
sudo nginx -t && sudo nginx -s reload

# Restart everything
sudo systemctl restart paas nginx
```
