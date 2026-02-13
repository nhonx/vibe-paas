# Quick Fix for Your Issues

## 🔴 Problem 1: Cannot access ivibe.site (only works with :3000)

### Fix (Run on your VPS):

```bash
# Make scripts executable
chmod +x scripts/*.sh

# Run the fix script
sudo ./scripts/fix-nginx.sh ivibe.site
```

This will:
- ✅ Configure Nginx to proxy port 80 → 3000
- ✅ Remove default site
- ✅ Update your domain in .env.local
- ✅ Reload Nginx
- ✅ Restart PaaS service

After running, test:
```bash
curl http://ivibe.site
```

---

## 🔴 Problem 2: Subdomain doesn't work after creating project

### Diagnosis:

```bash
# Check if Nginx config was created
sudo ls -la /etc/nginx/sites-enabled/

# You should see files like: test.conf, myapp.conf, etc.
```

### If configs are missing:

**Option 1: Check logs**
```bash
sudo journalctl -u paas -n 50
```

Look for errors like:
- "Permission denied" → Fix permissions
- "Nginx reload failed" → Fix Nginx config

**Option 2: Verify DNS**
```bash
dig test.ivibe.site
```

Should return your VPS IP. If not:
- Add wildcard DNS: `*.ivibe.site` → Your VPS IP
- Wait for DNS propagation (5-30 minutes)

**Option 3: Manually test**
```bash
# Check project was created
curl http://localhost:3000/api/projects

# Check project files exist
sudo ls -la /opt/paas/data/projects/

# Test Nginx config
sudo nginx -t
```

---

## 🚀 Complete Fix Procedure

Run these commands on your VPS:

```bash
# 1. Make scripts executable
cd /opt/paas
chmod +x scripts/*.sh

# 2. Fix Nginx configuration
sudo ./scripts/fix-nginx.sh ivibe.site

# 3. Check everything is working
sudo ./scripts/check-nginx.sh

# 4. Restart PaaS
sudo systemctl restart paas

# 5. Test main site
curl -I http://ivibe.site
```

---

## 📋 Checklist

After running the fix, verify:

- [ ] Main site works: `http://ivibe.site` (no port needed)
- [ ] Port 3000 still works: `http://ivibe.site:3000`
- [ ] Nginx is running: `sudo systemctl status nginx`
- [ ] PaaS is running: `sudo systemctl status paas`
- [ ] DNS is configured: `dig ivibe.site` and `dig *.ivibe.site`

---

## 🔍 If Still Not Working

### Check DNS Configuration

Your domain registrar needs these records:

```
Type: A
Name: @
Value: YOUR_VPS_IP

Type: A  
Name: *
Value: YOUR_VPS_IP
```

Test DNS:
```bash
# Should return your VPS IP
dig ivibe.site +short
dig test.ivibe.site +short
dig anything.ivibe.site +short
```

### Check Firewall

```bash
# Allow HTTP traffic
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw status
```

### View Live Logs

```bash
# Terminal 1: PaaS logs
sudo journalctl -u paas -f

# Terminal 2: Nginx logs
sudo tail -f /var/log/nginx/error.log
```

Then create a project and watch for errors.

---

## 📞 Get Help

If still having issues, run this and share the output:

```bash
sudo ./scripts/check-nginx.sh > nginx-report.txt
cat nginx-report.txt
```

Also share:
```bash
# PaaS logs
sudo journalctl -u paas -n 50

# Nginx error log
sudo tail -n 50 /var/log/nginx/error.log

# List configs
ls -la /etc/nginx/sites-enabled/
```

---

## ✅ Expected Behavior After Fix

1. **Main site:** `http://ivibe.site` → Shows PaaS UI
2. **With port:** `http://ivibe.site:3000` → Also works
3. **Create project "test":**
   - System creates `/etc/nginx/sites-enabled/test.conf`
   - System reloads Nginx
   - `http://test.ivibe.site` → Shows your project

---

## 🎯 Quick Test

After running the fix:

```bash
# Test 1: Main site
curl http://ivibe.site

# Test 2: Create a test project via API
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "name": "test",
    "type": "static",
    "source_type": "github",
    "source_path": "https://github.com/vercel/next.js.git"
  }'

# Test 3: Deploy it
curl -X POST http://localhost:3000/api/projects/1/deploy

# Test 4: Check subdomain (wait 30 seconds after deploy)
curl http://test.ivibe.site
```

---

## 💡 Pro Tip

Always check logs when creating projects:

```bash
# Watch logs in real-time
sudo journalctl -u paas -f
```

Then create project via UI. You'll see:
- ✅ "Created Nginx config for test"
- ✅ "Nginx reloaded successfully"
- ❌ Any errors that occur
