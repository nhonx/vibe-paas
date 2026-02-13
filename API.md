# API Documentation

Complete API reference for the PaaS Management System.

## Base URL

- Development: `http://localhost:8000`
- Production: `http://api.launch.me`

## Authentication

Currently, the API does not require authentication. In production, you should add authentication middleware.

## Endpoints

### Health Check

#### GET /

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "message": "PaaS Management API is running"
}
```

#### GET /api/health

Detailed health check.

**Response:**
```json
{
  "status": "healthy",
  "services": {
    "api": "running",
    "database": "connected"
  }
}
```

---

### Projects

#### POST /api/projects

Create a new project.

**Request Body:**
```json
{
  "name": "my-app",
  "type": "static",
  "source_type": "github",
  "source_path": "https://github.com/user/repo.git",
  "launch_command": "npm start",
  "description": "My awesome application"
}
```

**Fields:**
- `name` (required): Project name (lowercase, alphanumeric, hyphens only)
- `type` (required): `"static"` or `"serverside"`
- `source_type` (required): `"local"` or `"github"`
- `source_path` (required): GitHub URL or local file path
- `launch_command` (optional): Command to start the application (serverside only)
- `description` (optional): Project description

**Response:** `201 Created`
```json
{
  "id": 1,
  "name": "my-app",
  "type": "static",
  "status": "stopped",
  "source_type": "github",
  "source_path": "https://github.com/user/repo.git",
  "subdomain": "my-app",
  "port": null,
  "container_id": null,
  "launch_command": null,
  "dockerfile_path": null,
  "created_at": "2024-01-15T10:30:00",
  "updated_at": "2024-01-15T10:30:00",
  "description": "My awesome application",
  "error_message": null
}
```

---

#### GET /api/projects

List all projects.

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "name": "my-app",
    "type": "static",
    "status": "running",
    ...
  },
  {
    "id": 2,
    "name": "api-server",
    "type": "serverside",
    "status": "stopped",
    ...
  }
]
```

---

#### GET /api/projects/{project_id}

Get a specific project by ID.

**Parameters:**
- `project_id` (path): Project ID

**Response:** `200 OK`
```json
{
  "id": 1,
  "name": "my-app",
  "type": "static",
  "status": "running",
  "source_type": "github",
  "source_path": "https://github.com/user/repo.git",
  "subdomain": "my-app",
  "port": null,
  "container_id": null,
  "launch_command": null,
  "dockerfile_path": null,
  "created_at": "2024-01-15T10:30:00",
  "updated_at": "2024-01-15T10:30:00",
  "description": "My awesome application",
  "error_message": null
}
```

**Errors:**
- `404 Not Found`: Project does not exist

---

#### PUT /api/projects/{project_id}

Update project metadata.

**Parameters:**
- `project_id` (path): Project ID

**Request Body:**
```json
{
  "description": "Updated description",
  "launch_command": "npm run start:prod"
}
```

**Response:** `200 OK`
```json
{
  "id": 1,
  "name": "my-app",
  ...
}
```

---

#### POST /api/projects/{project_id}/deploy

Deploy a project (clone/copy source, build, and start).

**Parameters:**
- `project_id` (path): Project ID

**Response:** `200 OK`
```json
{
  "id": 1,
  "name": "my-app",
  "status": "running",
  ...
}
```

**Status Flow:**
1. `stopped` → `building` → `running` (success)
2. `stopped` → `building` → `failed` (error)

**Errors:**
- `404 Not Found`: Project does not exist
- `500 Internal Server Error`: Deployment failed (check `error_message` field)

---

#### POST /api/projects/{project_id}/start

Start a stopped project.

**Parameters:**
- `project_id` (path): Project ID

**Response:** `200 OK`
```json
{
  "message": "Project 'my-app' started successfully",
  "status": "running"
}
```

**Errors:**
- `404 Not Found`: Project does not exist
- `500 Internal Server Error`: Failed to start

---

#### POST /api/projects/{project_id}/stop

Stop a running project.

**Parameters:**
- `project_id` (path): Project ID

**Response:** `200 OK`
```json
{
  "message": "Project 'my-app' stopped successfully",
  "status": "stopped"
}
```

**Errors:**
- `404 Not Found`: Project does not exist
- `500 Internal Server Error`: Failed to stop

---

#### DELETE /api/projects/{project_id}

Delete a project (stops container, removes files, deletes from database).

**Parameters:**
- `project_id` (path): Project ID

**Response:** `204 No Content`

**Errors:**
- `404 Not Found`: Project does not exist
- `500 Internal Server Error`: Failed to delete

---

#### GET /api/projects/{project_id}/logs

Get container logs for a serverside project.

**Parameters:**
- `project_id` (path): Project ID
- `tail` (query, optional): Number of log lines to return (default: 100)

**Response:** `200 OK`
```json
{
  "logs": "2024-01-15T10:30:00 Starting application...\n2024-01-15T10:30:01 Server listening on port 80\n..."
}
```

**Note:** Returns "No logs available" for static projects.

---

## Status Values

Projects can have the following statuses:

- `stopped`: Project is not running
- `running`: Project is running and accessible
- `building`: Project is being deployed
- `failed`: Deployment or runtime error occurred (check `error_message`)

## Project Types

### Static Projects

- Served directly by Nginx
- No Docker container
- Suitable for: HTML/CSS/JS, React/Vue/Angular builds, static site generators

### Serverside Projects

- Run in Docker containers
- Auto-generated Dockerfile if not present
- Suitable for: Node.js, Python, Go, Ruby, PHP applications

## Error Responses

All errors follow this format:

```json
{
  "detail": "Error message describing what went wrong"
}
```

Common HTTP status codes:
- `400 Bad Request`: Invalid input
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

## Rate Limiting

Currently no rate limiting is implemented. Consider adding rate limiting in production.

## CORS

CORS is enabled for all origins in development. In production, configure specific origins in `backend/main.py`.

## Interactive Documentation

FastAPI provides interactive API documentation:

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Example Usage

### Python

```python
import requests

# Create a project
response = requests.post('http://localhost:8000/api/projects', json={
    'name': 'my-app',
    'type': 'static',
    'source_type': 'github',
    'source_path': 'https://github.com/user/repo.git'
})
project = response.json()

# Deploy the project
requests.post(f'http://localhost:8000/api/projects/{project["id"]}/deploy')

# List all projects
projects = requests.get('http://localhost:8000/api/projects').json()
print(projects)
```

### JavaScript

```javascript
// Create a project
const response = await fetch('http://localhost:8000/api/projects', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'my-app',
    type: 'static',
    source_type: 'github',
    source_path: 'https://github.com/user/repo.git'
  })
});
const project = await response.json();

// Deploy the project
await fetch(`http://localhost:8000/api/projects/${project.id}/deploy`, {
  method: 'POST'
});

// List all projects
const projects = await fetch('http://localhost:8000/api/projects')
  .then(r => r.json());
console.log(projects);
```

### cURL

```bash
# Create a project
curl -X POST http://localhost:8000/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "name": "my-app",
    "type": "static",
    "source_type": "github",
    "source_path": "https://github.com/user/repo.git"
  }'

# Deploy the project
curl -X POST http://localhost:8000/api/projects/1/deploy

# List all projects
curl http://localhost:8000/api/projects

# Get project logs
curl http://localhost:8000/api/projects/1/logs?tail=50
```
