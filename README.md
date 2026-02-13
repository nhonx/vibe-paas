# VPS Project Deployment System

A complete Platform-as-a-Service (PaaS) solution for deploying and managing static and serverside projects on a VPS.

## Features

- **Static Projects**: Deploy static websites using Nginx
- **Serverside Projects**: Deploy applications using Docker containers
- **Subdomain Routing**: Automatic subdomain configuration (e.g., `app.launch.me`)
- **GitHub Integration**: Clone and deploy directly from GitHub repositories
- **Project Management**: Start, stop, and monitor running projects
- **Web UI**: Simple Next.js interface for managing deployments

## Architecture

- **Backend**: Python FastAPI for project management and orchestration
- **Frontend**: Next.js static site for UI
- **Reverse Proxy**: Nginx for routing and serving static content
- **Containerization**: Docker for serverside applications

## Prerequisites

- Ubuntu/Debian VPS with root access
- Docker and Docker Compose installed
- Nginx installed
- Domain configured with wildcard DNS (*.launch.me → VPS IP)
- Python 3.9+
- Node.js 18+

## Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd paas
```

### 2. Install backend dependencies

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Install frontend dependencies

```bash
cd frontend
npm install
npm run build
```

### 4. Configure environment

```bash
cp backend/.env.example backend/.env
# Edit backend/.env with your settings
```

### 5. Set up Nginx

```bash
sudo cp nginx/paas.conf /etc/nginx/sites-available/paas
sudo ln -s /etc/nginx/sites-available/paas /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 6. Start the backend

```bash
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000
```

## Usage

1. Access the UI at `http://your-vps-ip:3000` or configure Nginx to serve it
2. Create a new project by providing:
   - Project name
   - Type (static or serverside)
   - Source (local path or GitHub URL)
   - Launch command (for serverside projects)
3. The system will automatically:
   - Configure Nginx with subdomain routing
   - Deploy static files or create Docker containers
   - Start the project

## Project Structure

```
paas/
├── backend/           # FastAPI backend
│   ├── main.py       # Main application
│   ├── models.py     # Data models
│   ├── services/     # Business logic
│   └── database.py   # Database configuration
├── frontend/         # Next.js frontend
│   ├── pages/        # UI pages
│   ├── components/   # React components
│   └── lib/          # Utilities
├── nginx/            # Nginx configuration templates
├── data/             # Project metadata and storage
└── docker-compose.yml
```

## API Endpoints

- `POST /api/projects` - Create a new project
- `GET /api/projects` - List all projects
- `GET /api/projects/{id}` - Get project details
- `POST /api/projects/{id}/start` - Start a project
- `POST /api/projects/{id}/stop` - Stop a project
- `DELETE /api/projects/{id}` - Delete a project

## Security Considerations

- Run backend with appropriate user permissions
- Use environment variables for sensitive data
- Configure firewall rules
- Use HTTPS with Let's Encrypt for production
- Implement authentication for the UI

## License

MIT
