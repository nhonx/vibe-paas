# Quick Reference Card

## 🚀 Getting Started

### Development
```bash
cd frontend
npm install
npm run dev
# Open http://localhost:3000
```

### Production
```bash
sudo ./scripts/install.sh
# Configure DNS: *.launch.me → VPS IP
# Open http://launch.me
```

---

## 📜 Essential Scripts

| Task | Command |
|------|---------|
| **Start Dev** | `./scripts/dev.sh` |
| **Install on VPS** | `sudo ./scripts/install.sh` |
| **Rebuild & Reload** | `sudo ./scripts/refresh.sh` |
| **Quick Restart** | `sudo ./scripts/quick-restart.sh` |
| **Delete All Projects** | `sudo ./scripts/reset-projects.sh` |
| **Start Service** | `sudo ./scripts/start.sh` |
| **Stop Service** | `sudo ./scripts/stop.sh` |

---

## 🔧 Common Tasks

### After Code Changes
```bash
sudo ./scripts/refresh.sh
```

### Clean All Projects
```bash
sudo ./scripts/reset-projects.sh
```

### Service Stuck?
```bash
sudo ./scripts/quick-restart.sh
```

### Update System
```bash
cd /opt/paas
git pull
sudo ./scripts/refresh.sh
```

---

## 📁 Important Paths

| Item | Path |
|------|------|
| **Application** | `/opt/paas/frontend` |
| **Database** | `/opt/paas/data/paas.db` |
| **Projects** | `/opt/paas/data/projects/` |
| **Nginx Configs** | `/etc/nginx/sites-enabled/` |
| **Service** | `systemctl status paas` |
| **Logs** | `journalctl -u paas -f` |

---

## 🌐 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | List all projects |
| POST | `/api/projects` | Create project |
| GET | `/api/projects/[id]` | Get project |
| POST | `/api/projects/[id]/deploy` | Deploy project |
| POST | `/api/projects/[id]/start` | Start project |
| POST | `/api/projects/[id]/stop` | Stop project |
| DELETE | `/api/projects/[id]` | Delete project |
| GET | `/api/projects/[id]/logs` | Get logs |

---

## 🐛 Troubleshooting

### Service Won't Start
```bash
journalctl -u paas -n 50
sudo systemctl restart paas
```

### Docker Issues
```bash
sudo systemctl status docker
docker ps
```

### Nginx Issues
```bash
sudo nginx -t
sudo nginx -s reload
```

### Database Locked
```bash
sudo systemctl stop paas
rm /opt/paas/data/paas.db-wal
sudo systemctl start paas
```

---

## 📦 Requirements

- **Node.js 18+**
- **Docker** (for serverside projects)
- **Nginx** (for production)

---

## 🔑 Environment Variables

Create `frontend/.env.local`:
```env
DOMAIN=launch.me
NGINX_CONFIG_PATH=/etc/nginx/sites-enabled
PROJECTS_BASE_PATH=./data/projects
PORT_RANGE_START=10000
PORT_RANGE_END=20000
```

---

## 📚 Documentation

- `SETUP.md` - Quick setup guide
- `SCRIPTS.md` - All scripts explained
- `README.md` - Full documentation
- `DEPLOYMENT.md` - Production deployment

---

## ⚡ Pro Tips

1. **Always use `refresh.sh`** after code changes (not full reinstall)
2. **Use `reset-projects.sh`** to clean test deployments
3. **Check logs** with `journalctl -u paas -f`
4. **Test locally first** with `npm run dev`
5. **Backup database** before major changes: `cp data/paas.db data/paas.db.backup`

---

## 🎯 Project Creation

**Via UI:** http://localhost:3000 → New Project

**Via API:**
```bash
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "name": "my-app",
    "type": "static",
    "source_type": "github",
    "source_path": "https://github.com/user/repo.git"
  }'
```

---

## 🔐 Security Checklist

- [ ] Configure firewall (UFW)
- [ ] Set up SSL with Let's Encrypt
- [ ] Add authentication to UI
- [ ] Regular backups
- [ ] Update system packages
- [ ] Monitor logs

---

## 💡 Quick Wins

**View all containers:**
```bash
docker ps -a --filter "name=paas-"
```

**View all projects:**
```bash
sqlite3 /opt/paas/data/paas.db "SELECT * FROM projects;"
```

**Check disk usage:**
```bash
du -sh /opt/paas/data/projects/*
```

**Clean unused Docker images:**
```bash
docker system prune -a
```
