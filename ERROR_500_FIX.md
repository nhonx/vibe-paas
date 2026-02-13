# 500 Internal Server Error - Fix Guide

## The Problem

DNS works, subdomain resolves, but accessing the site returns:
```
500 Internal Server Error
```

---

## Quick Fix

Run this on your VPS:

```bash
cd ~/vibe-paas
chmod +x scripts/fix-500-error.sh
sudo ./scripts/fix-500-error.sh guitar
```

This will automatically:
- ✅ Check if files exist
- ✅ Fix permissions (755 for dirs, 644 for files)
- ✅ Fix ownership (www-data:www-data)
- ✅ Reload Nginx
- ✅ Test the site

---

## Common Causes & Solutions

### Cause 1: Permission Denied

**Symptoms:**
- 500 error
- Nginx error log shows: "Permission denied"

**Fix:**
```bash
PROJECT_NAME="guitar"
sudo chmod -R 755 /opt/paas/data/projects/$PROJECT_NAME
sudo chown -R www-data:www-data /opt/paas/data/projects/$PROJECT_NAME
sudo systemctl reload nginx
```

---

### Cause 2: Missing Files

**Symptoms:**
- 500 error
- No index.html in project directory

**Check:**
```bash
ls -la /opt/paas/data/projects/guitar/
```

**Fix:**
```bash
# Redeploy the project
curl -X POST http://localhost:3000/api/projects/1/deploy
```

---

### Cause 3: Incorrect Nginx Root Path

**Symptoms:**
- 500 error
- Nginx config points to wrong directory

**Check:**
```bash
sudo cat /etc/nginx/sites-enabled/guitar.conf | grep root
```

Should show:
```nginx
root /opt/paas/data/projects/guitar;
```

**Fix:**
```bash
sudo nano /etc/nginx/sites-enabled/guitar.conf
# Update root path
sudo nginx -t
sudo nginx -s reload
```

---

### Cause 4: Empty Project Directory

**Symptoms:**
- Deployment succeeded but directory is empty

**Check:**
```bash
find /opt/paas/data/projects/guitar -type f | wc -l
# Should be > 0
```

**Fix:**
```bash
# Check deployment logs
sudo journalctl -u paas -n 100 | grep -i guitar

# Redeploy
curl -X POST http://localhost:3000/api/projects/1/deploy
```

---

### Cause 5: SELinux Blocking Access

**Symptoms:**
- 500 error on CentOS/RHEL
- SELinux is enforcing

**Check:**
```bash
getenforce
# If returns "Enforcing"
```

**Fix:**
```bash
# Temporary (until reboot)
sudo setenforce 0

# Permanent
sudo nano /etc/selinux/config
# Set: SELINUX=permissive
```

---

## Diagnostic Steps

### Step 1: Check Nginx Error Log

```bash
sudo tail -f /var/log/nginx/error.log
```

Then access the site and watch for errors.

**Common errors:**

#### "Permission denied"
```
[error] 1234#1234: *1 open() "/opt/paas/data/projects/guitar/index.html" failed (13: Permission denied)
```
**Fix:** Run `fix-500-error.sh` script

#### "No such file or directory"
```
[error] 1234#1234: *1 open() "/opt/paas/data/projects/guitar/index.html" failed (2: No such file or directory)
```
**Fix:** Redeploy project

#### "stat() failed"
```
[error] 1234#1234: *1 stat() "/opt/paas/data/projects/guitar" failed (13: Permission denied)
```
**Fix:** Fix directory permissions

---

### Step 2: Check Project Files

```bash
PROJECT_NAME="guitar"

# List files
ls -la /opt/paas/data/projects/$PROJECT_NAME/

# Check permissions
stat /opt/paas/data/projects/$PROJECT_NAME/

# Check if index.html exists
ls -la /opt/paas/data/projects/$PROJECT_NAME/index.html
```

**Expected:**
```
drwxr-xr-x  www-data www-data  /opt/paas/data/projects/guitar/
-rw-r--r--  www-data www-data  index.html
```

---

### Step 3: Check Nginx Config

```bash
sudo cat /etc/nginx/sites-enabled/guitar.conf
```

**Should look like:**
```nginx
server {
    listen 80;
    server_name guitar.ivibe.site;

    root /opt/paas/data/projects/guitar;
    index index.html index.htm;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

**Test syntax:**
```bash
sudo nginx -t
```

---

### Step 4: Test Manually

```bash
# Test with curl
curl -v http://guitar.ivibe.site

# Test with Host header
curl -v -H "Host: guitar.ivibe.site" http://localhost

# Check HTTP status
curl -I http://guitar.ivibe.site
```

---

### Step 5: Check PaaS Logs

```bash
# Recent logs
sudo journalctl -u paas -n 100

# Filter for your project
sudo journalctl -u paas | grep -i guitar

# Live logs
sudo journalctl -u paas -f
```

---

## Manual Fix Procedure

If the script doesn't work, do this manually:

### 1. Fix Permissions
```bash
PROJECT_NAME="guitar"
PROJECT_DIR="/opt/paas/data/projects/$PROJECT_NAME"

# Fix directory permissions
sudo find $PROJECT_DIR -type d -exec chmod 755 {} \;

# Fix file permissions
sudo find $PROJECT_DIR -type f -exec chmod 644 {} \;

# Fix ownership
sudo chown -R www-data:www-data $PROJECT_DIR
```

### 2. Verify Files
```bash
# Check files exist
ls -la $PROJECT_DIR

# Check index.html
cat $PROJECT_DIR/index.html | head -n 10
```

### 3. Reload Nginx
```bash
sudo nginx -t
sudo nginx -s reload
```

### 4. Test
```bash
curl http://guitar.ivibe.site
```

---

## Still Getting 500?

### Check Detailed Error

```bash
# Enable debug logging (temporary)
sudo nano /etc/nginx/nginx.conf
```

Change:
```nginx
error_log /var/log/nginx/error.log warn;
```

To:
```nginx
error_log /var/log/nginx/error.log debug;
```

Then:
```bash
sudo nginx -s reload
curl http://guitar.ivibe.site
sudo tail -n 50 /var/log/nginx/error.log
```

---

### Check if it's a Serverside Project

If it's a serverside project (not static):

```bash
# Check if container is running
docker ps | grep guitar

# Check container logs
docker logs paas-guitar

# Check port
sudo netstat -tlnp | grep <port>
```

---

### Redeploy Project

```bash
# Get project ID
curl http://localhost:3000/api/projects | jq

# Redeploy
curl -X POST http://localhost:3000/api/projects/1/deploy

# Watch logs
sudo journalctl -u paas -f
```

---

## Prevention

### Always Check After Deployment

```bash
PROJECT_NAME="guitar"

# 1. Files exist
ls -la /opt/paas/data/projects/$PROJECT_NAME/

# 2. Permissions correct
stat /opt/paas/data/projects/$PROJECT_NAME/

# 3. Nginx config exists
cat /etc/nginx/sites-enabled/$PROJECT_NAME.conf

# 4. Nginx syntax OK
sudo nginx -t

# 5. Test HTTP
curl -I http://$PROJECT_NAME.ivibe.site
```

---

## Quick Reference

```bash
# Fix 500 error
sudo ./scripts/fix-500-error.sh guitar

# Check Nginx errors
sudo tail -f /var/log/nginx/error.log

# Check PaaS logs
sudo journalctl -u paas -f

# Fix permissions
sudo chmod -R 755 /opt/paas/data/projects/guitar
sudo chown -R www-data:www-data /opt/paas/data/projects/guitar

# Reload Nginx
sudo nginx -s reload

# Test
curl http://guitar.ivibe.site
```

---

## Common Error Messages

| Error in Log | Cause | Fix |
|-------------|-------|-----|
| Permission denied (13) | Wrong permissions | `chmod 755` + `chown www-data` |
| No such file (2) | Files missing | Redeploy project |
| stat() failed | Directory permissions | `chmod 755` on parent dirs |
| Connection refused | Backend not running | Start container |
| Upstream timed out | Backend slow/crashed | Check container logs |

---

## Summary

**Most common cause:** File permissions

**Quick fix:** `sudo ./scripts/fix-500-error.sh guitar`

**Check logs:** `sudo tail -f /var/log/nginx/error.log`

**Manual fix:** Fix permissions, ownership, reload Nginx
