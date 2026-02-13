# Quick Start Guide

Get the PaaS system running in minutes!

## Development Mode (Local Testing)

### Windows

1. Open Command Prompt or PowerShell in the project directory
2. Run the development script:
   ```cmd
   scripts\dev.bat
   ```

3. Access the application:
   - Frontend UI: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

### Linux/Mac

1. Open terminal in the project directory
2. Make the script executable and run it:
   ```bash
   chmod +x scripts/dev.sh
   ./scripts/dev.sh
   ```

3. Access the application:
   - Frontend UI: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

## Using the System

### Creating Your First Project

1. Open the UI at http://localhost:3000
2. Click "New Project" button
3. Fill in the form:
   - **Project Name**: Use lowercase letters, numbers, and hyphens (e.g., `my-app`)
   - **Project Type**: 
     - Choose "Static" for HTML/CSS/JS sites
     - Choose "Serverside" for Node.js, Python, etc.
   - **Source Type**:
     - "GitHub Repository" - Enter a GitHub URL
     - "Local Path" - Enter an absolute path on your system
   - **Launch Command** (Serverside only): Optional, auto-detected if not provided

4. Click "Create Project" - the system will automatically deploy it!

### Example Projects

#### Static Website (GitHub)

```
Name: my-portfolio
Type: Static
Source Type: GitHub Repository
Source Path: https://github.com/username/portfolio.git
```

#### Node.js App (GitHub)

```
Name: my-api
Type: Serverside
Source Type: GitHub Repository
Source Path: https://github.com/username/nodejs-app.git
Launch Command: ["npm", "start"]
```

#### Python App (Local)

```
Name: flask-app
Type: Serverside
Source Type: Local Path
Source Path: /path/to/your/flask-app
Launch Command: ["python", "app.py"]
```

### Managing Projects

- **Start**: Click the "Start" button on a stopped project
- **Stop**: Click the "Stop" button on a running project
- **Details**: Click "Details" to view project information and logs
- **Delete**: Click "Delete" to remove a project (confirmation required)

### Accessing Deployed Projects

In development mode, projects are accessible at:
- `http://<project-name>.ivibe.site` (requires DNS configuration)

In production, configure your DNS to point `*.ivibe.site` to your VPS IP.

## Production Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for complete production deployment instructions.

### Quick Production Setup

1. SSH into your VPS
2. Clone the repository
3. Run the installation script:
   ```bash
   sudo ./scripts/install.sh
   ```
4. Configure DNS (wildcard A record: `*.ivibe.site → VPS_IP`)
5. Access at `http://ivibe.site`

## Docker Compose (Alternative)

Start everything with Docker:

```bash
docker-compose up -d
```

Stop everything:

```bash
docker-compose down
```

View logs:

```bash
docker-compose logs -f
```

## API Usage

You can also interact with the system via API:

### Create a Project

```bash
curl -X POST http://localhost:8000/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "name": "my-app",
    "type": "static",
    "source_type": "github",
    "source_path": "https://github.com/user/repo.git"
  }'
```

### List Projects

```bash
curl http://localhost:8000/api/projects
```

### Deploy a Project

```bash
curl -X POST http://localhost:8000/api/projects/1/deploy
```

### Start a Project

```bash
curl -X POST http://localhost:8000/api/projects/1/start
```

### Stop a Project

```bash
curl -X POST http://localhost:8000/api/projects/1/stop
```

## Troubleshooting

### Port Already in Use

If ports 3000 or 8000 are already in use:

1. Stop the conflicting service
2. Or modify the ports in:
   - Backend: `backend/main.py` (change port in `uvicorn.run()`)
   - Frontend: `frontend/package.json` (add `-p 3001` to dev script)

### Docker Not Available

If you get Docker errors in development:

1. Install Docker Desktop (Windows/Mac) or Docker Engine (Linux)
2. Start Docker
3. Verify: `docker --version`

### Cannot Clone GitHub Repository

If cloning fails:

1. Verify the repository URL is correct
2. For private repos, you'll need to configure SSH keys or access tokens
3. Try using a public repository first

### Nginx Not Found (Development)

In development mode, Nginx configuration is created but may not be applied. This is normal - the system will work without Nginx in dev mode. For full functionality, deploy to a VPS.

## Next Steps

- Read [DEPLOYMENT.md](DEPLOYMENT.md) for production deployment
- Check [README.md](README.md) for architecture details
- Explore the API documentation at http://localhost:8000/docs
- Customize the UI in `frontend/` directory
- Extend the backend in `backend/` directory

## Support

For issues or questions:
1. Check the logs (see DEPLOYMENT.md for log locations)
2. Review the troubleshooting sections
3. Open an issue on GitHub
