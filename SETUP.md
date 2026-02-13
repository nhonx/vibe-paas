# Quick Setup Guide

The project has been refactored to use **Next.js only** (no Python required).

## What Changed

- ✅ Removed Python/FastAPI backend
- ✅ All logic now runs in Next.js API routes
- ✅ Uses better-sqlite3 for database
- ✅ Uses dockerode for Docker management
- ✅ Simpler deployment - just Node.js required

## Requirements

- **Node.js 18+**
- **Docker** (for deploying serverside projects)
- **Nginx** (for production)

## Quick Start (Development)

### Windows
```cmd
cd frontend
npm install
npm run dev
```

### Linux/Mac
```bash
cd frontend
npm install
npm run dev
```

Or use the scripts:
- Windows: `scripts\dev.bat`
- Linux/Mac: `scripts/dev.sh`

Then open: **http://localhost:3000**

## Production Deployment

1. **Install on VPS:**
```bash
sudo ./scripts/install.sh
```

2. **Configure DNS:**
- `launch.me` → Your VPS IP
- `*.launch.me` → Your VPS IP (wildcard)

3. **Access:** http://launch.me

## Project Structure

```
paas/
├── frontend/
│   ├── pages/
│   │   ├── api/          # API routes (replaces FastAPI)
│   │   │   ├── health.ts
│   │   │   └── projects/ # Project management endpoints
│   │   └── index.tsx     # UI
│   ├── lib/
│   │   ├── db.ts         # SQLite database
│   │   ├── docker.ts     # Docker management
│   │   ├── nginx.ts      # Nginx config generation
│   │   └── project-service.ts  # Business logic
│   └── components/       # React components
├── scripts/              # Deployment scripts
└── nginx/               # Nginx config template
```

## Environment Variables

Create `frontend/.env.local`:

```env
DOMAIN=launch.me
NGINX_CONFIG_PATH=/etc/nginx/sites-enabled
PROJECTS_BASE_PATH=./data/projects
PORT_RANGE_START=10000
PORT_RANGE_END=20000
```

## API Endpoints

All at `/api/`:

- `GET /api/projects` - List projects
- `POST /api/projects` - Create project
- `GET /api/projects/[id]` - Get project
- `POST /api/projects/[id]/deploy` - Deploy project
- `POST /api/projects/[id]/start` - Start project
- `POST /api/projects/[id]/stop` - Stop project
- `DELETE /api/projects/[id]` - Delete project
- `GET /api/projects/[id]/logs` - Get logs

## Troubleshooting

### Module not found errors
```bash
cd frontend
npm install
```

### Docker errors
Make sure Docker is running:
```bash
docker --version
docker ps
```

### Permission errors (Linux)
```bash
sudo usermod -aG docker $USER
# Logout and login again
```

## Benefits of This Refactor

1. **Simpler deployment** - No Python installation needed
2. **Single codebase** - Everything in Next.js
3. **Easier maintenance** - One language (TypeScript/JavaScript)
4. **Better performance** - Native Node.js modules
5. **Smaller footprint** - Fewer dependencies

## Notes

- Database is SQLite stored in `data/paas.db`
- Project files stored in `data/projects/`
- Nginx configs in `/etc/nginx/sites-enabled/` (production)
- Docker containers managed via dockerode
