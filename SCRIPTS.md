# Scripts Reference

Quick reference for all available scripts.

## Development Scripts

### `dev.sh` / `dev.bat`
Start the development environment.

**Linux/Mac:**
```bash
./scripts/dev.sh
```

**Windows:**
```cmd
scripts\dev.bat
```

**What it does:**
- Creates data directories
- Installs npm dependencies (if needed)
- Creates `.env.local` (if needed)
- Starts Next.js dev server on port 3000

---

## Production Scripts

### `install.sh`
Full installation on a fresh VPS.

```bash
sudo ./scripts/install.sh
```

**What it does:**
- Installs Node.js, Docker, Nginx
- Sets up project in `/opt/paas`
- Installs dependencies
- Builds application
- Configures systemd service
- Configures Nginx
- Starts the service

**Use when:** First time setup on VPS

---

### `start.sh`
Start the PaaS service.

```bash
sudo ./scripts/start.sh
```

**What it does:**
- Starts the systemd service
- Shows service status

**Use when:** Service is stopped and you want to start it

---

### `stop.sh`
Stop the PaaS service.

```bash
sudo ./scripts/stop.sh
```

**What it does:**
- Stops the systemd service

**Use when:** You need to stop the service temporarily

---

## Maintenance Scripts

### `refresh.sh` / `refresh.bat` ⭐ NEW
Rebuild and reload without reinstalling dependencies.

**Linux/Mac:**
```bash
sudo ./scripts/refresh.sh
```

**Windows:**
```cmd
scripts\refresh.bat
```

**What it does:**
- Stops service (if production)
- Pulls latest git changes (if git repo)
- Updates npm packages
- Rebuilds application
- Reloads Nginx
- Restarts service (if production)

**Use when:**
- After code changes
- After updating dependencies
- Need to reload Nginx configs
- Want to update without full reinstall

**Does NOT:**
- Reinstall Node.js
- Reinstall Docker
- Reinstall Nginx
- Modify system packages

---

### `quick-restart.sh` / `quick-restart.bat` ⭐ NEW
Quick service restart without rebuild.

**Linux/Mac:**
```bash
sudo ./scripts/quick-restart.sh
```

**Windows:**
```cmd
scripts\quick-restart.bat
```

**What it does:**
- Restarts the systemd service (production)
- Shows instructions (development)

**Use when:**
- Service is stuck
- Need quick restart
- No code changes, just restart

---

## Project Management Scripts

### `reset-projects.sh` / `reset-projects.bat` ⭐ NEW
⚠️ **DANGER:** Wipe out all existing projects.

**Linux/Mac:**
```bash
sudo ./scripts/reset-projects.sh
```

**Windows:**
```cmd
scripts\reset-projects.bat
```

**What it does:**
- Stops all project containers
- Removes all project containers
- Removes all project Docker images
- Deletes all project files
- Clears the database
- Removes all Nginx configurations
- Reloads Nginx

**Use when:**
- Want to start fresh
- Testing deployment
- Cleaning up after testing
- Removing all projects at once

**⚠️ WARNING:**
- Requires double confirmation
- Cannot be undone
- All project data will be lost
- Does NOT affect the PaaS system itself

---

## Script Comparison

| Script | Reinstalls Deps | Rebuilds App | Restarts Service | Reloads Nginx | Wipes Projects |
|--------|----------------|--------------|------------------|---------------|----------------|
| `install.sh` | ✅ | ✅ | ✅ | ✅ | ❌ |
| `refresh.sh` | ❌ | ✅ | ✅ | ✅ | ❌ |
| `quick-restart.sh` | ❌ | ❌ | ✅ | ❌ | ❌ |
| `reset-projects.sh` | ❌ | ❌ | ❌ | ✅ | ✅ |
| `start.sh` | ❌ | ❌ | ✅ | ❌ | ❌ |
| `stop.sh` | ❌ | ❌ | ✅ (stop) | ❌ | ❌ |

---

## Common Workflows

### After Code Changes
```bash
sudo ./scripts/refresh.sh
```

### After Updating package.json
```bash
sudo ./scripts/refresh.sh
```

### Service Not Responding
```bash
sudo ./scripts/quick-restart.sh
```

### Clean Slate for Testing
```bash
sudo ./scripts/reset-projects.sh
sudo ./scripts/refresh.sh
```

### Full System Update
```bash
cd /opt/paas
git pull
sudo ./scripts/refresh.sh
```

### Start Fresh Development
```bash
./scripts/reset-projects.sh  # Clean projects
./scripts/dev.sh             # Start dev server
```

---

## Permissions

**Linux/Mac:** Make scripts executable first:
```bash
chmod +x scripts/*.sh
```

**Production scripts need sudo:**
```bash
sudo ./scripts/install.sh
sudo ./scripts/refresh.sh
sudo ./scripts/reset-projects.sh
sudo ./scripts/start.sh
sudo ./scripts/stop.sh
sudo ./scripts/quick-restart.sh
```

**Development scripts don't need sudo:**
```bash
./scripts/dev.sh
./scripts/reset-projects.sh  # In dev mode
```

---

## Troubleshooting

### "Permission denied"
```bash
chmod +x scripts/*.sh
```

### "Command not found: npm"
Run `install.sh` first to install Node.js

### "Cannot connect to Docker"
```bash
sudo systemctl start docker
```

### Reset script asks for confirmation twice
This is intentional for safety. Type exactly:
1. `yes`
2. `DELETE ALL PROJECTS`

---

## Notes

- All scripts are safe to run multiple times
- Scripts detect production vs development mode automatically
- Production mode = `/opt/paas` exists
- Development mode = running from any other directory
- Windows scripts (`.bat`) are for development only
- Linux scripts (`.sh`) work in both dev and production
