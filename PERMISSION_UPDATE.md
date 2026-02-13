# Permission Fix Update

## What Was Fixed

Updated `frontend/lib/project-service.ts` to automatically set correct permissions when creating projects.

### Changes Made:

1. **Added `fixProjectPermissions()` function** - Automatically fixes permissions after cloning/copying files
2. **Sets directory permissions to 755** - Allows Nginx to read directories
3. **Sets file permissions to 644** - Allows Nginx to read files
4. **Changes ownership to www-data:www-data** - Nginx user
5. **Runs automatically on every deployment** - No manual intervention needed

---

## Apply the Update

### Step 1: Pull Latest Code

```bash
cd ~/vibe-paas
git pull
```

Or if you copied files manually, the updated `project-service.ts` is ready.

### Step 2: Rebuild the Application

```bash
cd ~/vibe-paas
sudo ./scripts/refresh.sh
```

This will:
- Update npm packages
- Rebuild the application with new code
- Restart the service

### Step 3: Fix Existing Projects

```bash
sudo ./scripts/fix-all-permissions.sh
```

This will fix permissions for all existing projects (guitar, test, etc.)

### Step 4: Test

```bash
curl http://guitar.ivibe.site
curl http://test.ivibe.site
```

Should now return **200 OK** instead of 500!

---

## What the Fix Does

### Before (Old Code):
```typescript
// Just created directory with default permissions
fs.mkdirSync(projectDir, { recursive: true });
// Files had wrong owner/permissions
```

### After (New Code):
```typescript
// Creates directory with 755 permissions
fs.mkdirSync(projectDir, { recursive: true, mode: 0o755 });

// Automatically fixes all permissions
fixProjectPermissions(projectDir);
// - Directories: 755 (rwxr-xr-x)
// - Files: 644 (rw-r--r--)
// - Owner: www-data:www-data
```

---

## For Future Projects

After this update, **new projects will automatically have correct permissions**. No manual fixes needed!

When you create a new project:
1. Files are cloned/copied
2. Permissions are automatically fixed
3. Ownership is set to www-data
4. Nginx config is created
5. Site works immediately ✓

---

## Verify the Fix

### Check the code was updated:

```bash
grep -A 5 "fixProjectPermissions" ~/vibe-paas/frontend/lib/project-service.ts
```

Should show the new function.

### Check service is running with new code:

```bash
sudo systemctl status paas
sudo journalctl -u paas -n 20
```

Should show recent restart.

### Create a test project:

Via UI or API:
```bash
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "name": "permtest",
    "type": "static",
    "source_type": "github",
    "source_path": "https://github.com/vercel/next.js.git"
  }'
```

Deploy it:
```bash
curl -X POST http://localhost:3000/api/projects/2/deploy
```

Check permissions:
```bash
ls -la /opt/paas/data/projects/permtest/
# Should show: drwxr-xr-x www-data www-data
```

Test it:
```bash
curl http://permtest.ivibe.site
# Should return 200 OK
```

---

## Manual Permission Fix (If Needed)

If you need to fix a specific project manually:

```bash
PROJECT="guitar"
sudo find /opt/paas/data/projects/$PROJECT -type d -exec chmod 755 {} \;
sudo find /opt/paas/data/projects/$PROJECT -type f -exec chmod 644 {} \;
sudo chown -R www-data:www-data /opt/paas/data/projects/$PROJECT
sudo nginx -s reload
```

---

## Troubleshooting

### "Permission denied" still appearing

**Check if service restarted:**
```bash
sudo systemctl restart paas
```

**Check if code was updated:**
```bash
grep "fixProjectPermissions" ~/vibe-paas/frontend/lib/project-service.ts
```

**Manually fix existing projects:**
```bash
sudo ./scripts/fix-all-permissions.sh
```

### "Cannot change ownership"

If you see this warning in logs, it means the service isn't running as root. The code will still make files world-readable as a fallback.

**To run as root (recommended):**
Check your systemd service file:
```bash
sudo cat /etc/systemd/system/paas.service
```

Should have:
```
User=root
```

### New projects still have wrong permissions

**Check logs during deployment:**
```bash
sudo journalctl -u paas -f
```

Should see:
```
Fixing permissions for: /opt/paas/data/projects/projectname
✓ Ownership changed to www-data:www-data
✓ Permissions fixed for /opt/paas/data/projects/projectname
```

---

## Summary

✅ **Updated:** `project-service.ts` now fixes permissions automatically

✅ **Run:** `sudo ./scripts/refresh.sh` to apply update

✅ **Fix existing:** `sudo ./scripts/fix-all-permissions.sh`

✅ **Test:** Create new project - should work without 500 errors

✅ **Future:** All new projects will have correct permissions automatically
