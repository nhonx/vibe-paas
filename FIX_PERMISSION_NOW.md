# Fix 500 Permission Error - Complete Solution

## What Was Fixed

1. ✅ **Removed hardcoded `/opt/paas` paths** - Now uses dynamic paths
2. ✅ **Enhanced permission fixing** - More robust with better logging
3. ✅ **Added verification** - Checks permissions were actually set
4. ✅ **Better error handling** - Throws errors if permission fix fails

---

## Apply the Fix NOW

### Step 1: Update the Code

```bash
cd ~/vibe-paas

# Pull latest changes
git pull

# Or if you're copying files, the updated files are ready
```

### Step 2: Rebuild and Restart

```bash
cd ~/vibe-paas
sudo ./scripts/refresh.sh
```

### Step 3: Fix Existing Projects

```bash
cd ~/vibe-paas
sudo ./scripts/fix-all-permissions.sh
```

### Step 4: Test

```bash
curl http://guitar.ivibe.site
curl http://test.ivibe.site
```

---

## Detailed Testing

### Test 1: Check if www-data can access files

```bash
cd ~/vibe-paas
sudo ./scripts/test-permissions.sh guitar
```

This will show:
- ✓ Can www-data read the directory?
- ✓ Can www-data read index.html?
- ✓ What are the current permissions?
- ✓ What's the HTTP status?

### Test 2: Watch logs during deployment

**Terminal 1:**
```bash
sudo journalctl -u paas -f
```

**Terminal 2:**
Create a new project via UI

**Look for in logs:**
```
Fixing permissions for: /home/ubuntu/vibe-paas/data/projects/projectname
Setting directory permissions to 755...
Setting file permissions to 644...
Changing ownership to www-data:www-data...
✓ Ownership changed to www-data:www-data
✓ Final directory permissions: 755
✓ Permissions fixed
```

### Test 3: Check Nginx error log

```bash
sudo tail -f /var/log/nginx/error.log
```

Then access your site. Should see NO errors.

---

## Manual Fix for Existing Projects

If the scripts don't work, fix manually:

```bash
cd ~/vibe-paas

# Fix specific project
PROJECT="guitar"
sudo find data/projects/$PROJECT -type d -exec chmod 755 {} \;
sudo find data/projects/$PROJECT -type f -exec chmod 644 {} \;
sudo chown -R www-data:www-data data/projects/$PROJECT

# Verify
ls -la data/projects/$PROJECT/
# Should show: drwxr-xr-x www-data www-data

# Test
curl http://$PROJECT.ivibe.site
```

---

## Why 500 Error Happens

The Nginx error log showed:
```
stat() "/home/ubuntu/vibe-paas/data/projects/test/index.html" 
failed (13: Permission denied)
```

**Root cause:** Files are owned by `ubuntu` user, but Nginx runs as `www-data` user.

**Solution:** Change ownership to `www-data:www-data` and set proper permissions.

---

## What the Fix Does

### Before:
```bash
# Files owned by ubuntu
-rw-r--r-- ubuntu ubuntu index.html

# Nginx (www-data) tries to read
# Result: Permission denied → 500 error
```

### After:
```bash
# Files owned by www-data
-rw-r--r-- www-data www-data index.html

# Nginx (www-data) can read
# Result: Success → 200 OK
```

---

## Verify the Fix is Working

### Check 1: Code has the fix

```bash
cd ~/vibe-paas
grep -A 10 "fixProjectPermissions" frontend/lib/project-service.ts
```

Should show the enhanced function with:
- `execSync` with `stdio: 'inherit'`
- `chown -R www-data:www-data`
- Verification logging

### Check 2: Service is restarted

```bash
sudo systemctl status paas
# Should show recent restart time
```

### Check 3: Create test project

```bash
# Create via API
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "name": "permtest",
    "type": "static",
    "source_type": "github",
    "source_path": "https://github.com/vercel/next.js.git"
  }'

# Deploy it
curl -X POST http://localhost:3000/api/projects/2/deploy

# Watch logs
sudo journalctl -u paas -f
# Should see permission fixing messages

# Check permissions
ls -la ~/vibe-paas/data/projects/permtest/
# Should show: www-data www-data

# Test HTTP
curl http://permtest.ivibe.site
# Should return 200 OK
```

---

## Troubleshooting

### Still getting 500 error?

**1. Check if service is running as root:**
```bash
ps aux | grep "npm start" | grep -v grep
```

Should show `root` as the user. If not:

```bash
sudo systemctl status paas
sudo systemctl restart paas
```

**2. Check if www-data user exists:**
```bash
id www-data
```

Should show user info. If not:
```bash
sudo useradd -r -s /bin/false www-data
```

**3. Manually test as www-data:**
```bash
sudo -u www-data cat ~/vibe-paas/data/projects/guitar/index.html
```

If this fails, permissions are still wrong.

**4. Check parent directory permissions:**
```bash
ls -la ~/vibe-paas/data/
ls -la ~/vibe-paas/data/projects/
```

All parent directories need execute permission (x) for www-data to traverse.

**5. Fix parent directories:**
```bash
chmod 755 ~/vibe-paas
chmod 755 ~/vibe-paas/data
chmod 755 ~/vibe-paas/data/projects
```

---

## Key Changes Made

### 1. Enhanced `fixProjectPermissions()` function

**Old:**
```typescript
execSync(`chown -R www-data:www-data "${projectDir}"`, { stdio: 'pipe' });
// Silent failure
```

**New:**
```typescript
execSync(`chown -R www-data:www-data "${projectDir}"`, { stdio: 'inherit' });
// Shows output, throws on error
console.log(`✓ Ownership changed to www-data:www-data`);
// Verifies it worked
```

### 2. Removed hardcoded paths

**Old:**
```bash
PROJECTS_DIR="/opt/paas/data/projects"
```

**New:**
```bash
if [ -d "/opt/paas" ]; then
    BASE_DIR="/opt/paas"
else
    BASE_DIR="$(pwd)"
fi
PROJECTS_DIR="$BASE_DIR/data/projects"
```

### 3. Added verification

```typescript
// Verify permissions were actually set
const stats = fs.statSync(projectDir);
console.log(`Directory owner: ${stats.uid}:${stats.gid}`);
console.log(`Directory mode: ${(stats.mode & parseInt('777', 8)).toString(8)}`);
```

---

## Files Updated

1. ✅ `frontend/lib/project-service.ts` - Enhanced permission fixing
2. ✅ `scripts/fix-all-permissions.sh` - Dynamic paths
3. ✅ `scripts/fix-500-error.sh` - Dynamic paths
4. ✅ `scripts/debug-project.sh` - Dynamic paths
5. ✅ `scripts/test-permissions.sh` - NEW: Test file access

---

## Summary

**Problem:** Files owned by `ubuntu`, Nginx runs as `www-data` → Permission denied

**Solution:** Automatically change ownership to `www-data:www-data` on deployment

**Apply:** `sudo ./scripts/refresh.sh` then `sudo ./scripts/fix-all-permissions.sh`

**Test:** `curl http://guitar.ivibe.site` should return 200 OK

**Verify:** `sudo ./scripts/test-permissions.sh guitar`
