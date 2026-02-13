# Example Projects

Test the PaaS system with these example projects.

## Static Website Examples

### 1. Simple HTML Site

Create a test folder with these files:

**index.html**
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Static Site</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        h1 { font-size: 3em; }
        .card {
            background: rgba(255, 255, 255, 0.1);
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <h1>🚀 Hello from PaaS!</h1>
    <div class="card">
        <h2>Welcome to your deployed site</h2>
        <p>This static website is being served by Nginx through the PaaS system.</p>
        <p>Current time: <span id="time"></span></p>
    </div>
    <script>
        setInterval(() => {
            document.getElementById('time').textContent = new Date().toLocaleTimeString();
        }, 1000);
    </script>
</body>
</html>
```

**Deploy:**
```
Name: my-static-site
Type: Static
Source Type: Local Path
Source Path: /path/to/your/folder
```

### 2. React Build (from GitHub)

Use any React app repository, build it, and deploy the `build` folder.

**Example repositories:**
- `https://github.com/facebook/create-react-app` (after building)
- Any React app with a `build` or `dist` folder

**Deploy:**
```
Name: react-app
Type: Static
Source Type: GitHub Repository
Source Path: https://github.com/user/react-app.git
```

## Serverside Examples

### 1. Node.js Express Server

**app.js**
```javascript
const express = require('express');
const app = express();
const port = process.env.PORT || 80;

app.get('/', (req, res) => {
    res.json({
        message: 'Hello from Node.js!',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

app.get('/health', (req, res) => {
    res.json({ status: 'healthy' });
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on port ${port}`);
});
```

**package.json**
```json
{
  "name": "express-app",
  "version": "1.0.0",
  "main": "app.js",
  "scripts": {
    "start": "node app.js"
  },
  "dependencies": {
    "express": "^4.18.2"
  }
}
```

**Deploy:**
```
Name: express-api
Type: Serverside
Source Type: Local Path
Source Path: /path/to/express-app
Launch Command: ["npm", "start"]
```

### 2. Python Flask API

**app.py**
```python
from flask import Flask, jsonify
from datetime import datetime
import os

app = Flask(__name__)

@app.route('/')
def hello():
    return jsonify({
        'message': 'Hello from Flask!',
        'timestamp': datetime.now().isoformat(),
        'environment': os.getenv('FLASK_ENV', 'production')
    })

@app.route('/health')
def health():
    return jsonify({'status': 'healthy'})

if __name__ == '__main__':
    port = int(os.getenv('PORT', 80))
    app.run(host='0.0.0.0', port=port)
```

**requirements.txt**
```
Flask==3.0.0
```

**Deploy:**
```
Name: flask-api
Type: Serverside
Source Type: Local Path
Source Path: /path/to/flask-app
Launch Command: ["python", "app.py"]
```

### 3. Python FastAPI

**main.py**
```python
from fastapi import FastAPI
from datetime import datetime
import os

app = FastAPI(title="My API")

@app.get("/")
async def root():
    return {
        "message": "Hello from FastAPI!",
        "timestamp": datetime.now().isoformat(),
        "docs": "/docs"
    }

@app.get("/health")
async def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 80))
    uvicorn.run(app, host="0.0.0.0", port=port)
```

**requirements.txt**
```
fastapi==0.109.0
uvicorn[standard]==0.27.0
```

**Deploy:**
```
Name: fastapi-app
Type: Serverside
Source Type: Local Path
Source Path: /path/to/fastapi-app
Launch Command: ["python", "main.py"]
```

### 4. Go Web Server

**main.go**
```go
package main

import (
    "encoding/json"
    "fmt"
    "log"
    "net/http"
    "os"
    "time"
)

type Response struct {
    Message   string `json:"message"`
    Timestamp string `json:"timestamp"`
}

func main() {
    port := os.Getenv("PORT")
    if port == "" {
        port = "80"
    }

    http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Content-Type", "application/json")
        json.NewEncoder(w).Encode(Response{
            Message:   "Hello from Go!",
            Timestamp: time.Now().Format(time.RFC3339),
        })
    })

    http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Content-Type", "application/json")
        json.NewEncoder(w).Encode(map[string]string{"status": "healthy"})
    })

    addr := "0.0.0.0:" + port
    fmt.Printf("Server starting on %s\n", addr)
    log.Fatal(http.ListenAndServe(addr, nil))
}
```

**go.mod**
```
module myapp

go 1.21
```

**Deploy:**
```
Name: go-server
Type: Serverside
Source Type: Local Path
Source Path: /path/to/go-app
```

### 5. Node.js with Database (MongoDB)

**server.js**
```javascript
const express = require('express');
const app = express();
const port = process.env.PORT || 80;

app.use(express.json());

let items = [];

app.get('/', (req, res) => {
    res.json({
        message: 'Todo API',
        endpoints: {
            'GET /items': 'List all items',
            'POST /items': 'Create item',
            'DELETE /items/:id': 'Delete item'
        }
    });
});

app.get('/items', (req, res) => {
    res.json(items);
});

app.post('/items', (req, res) => {
    const item = {
        id: Date.now(),
        text: req.body.text,
        created: new Date().toISOString()
    };
    items.push(item);
    res.json(item);
});

app.delete('/items/:id', (req, res) => {
    items = items.filter(item => item.id !== parseInt(req.params.id));
    res.json({ success: true });
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Todo API running on port ${port}`);
});
```

**package.json**
```json
{
  "name": "todo-api",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2"
  }
}
```

**Deploy:**
```
Name: todo-api
Type: Serverside
Source Type: Local Path
Source Path: /path/to/todo-api
Launch Command: ["npm", "start"]
```

## Public GitHub Examples

You can use these public repositories for testing:

### Static Sites
- **Simple Portfolio**: `https://github.com/github/personal-website.git`
- **Documentation Site**: `https://github.com/facebook/docusaurus.git` (after build)

### Node.js Apps
- **Express Example**: `https://github.com/expressjs/express.git` (examples folder)
- **Next.js Example**: `https://github.com/vercel/next.js.git` (examples folder)

### Python Apps
- **Flask Example**: `https://github.com/pallets/flask.git` (examples folder)
- **FastAPI Example**: `https://github.com/tiangolo/fastapi.git` (examples folder)

## Testing Your Deployment

After deploying, test your application:

### For Static Sites
```bash
curl http://<project-name>.launch.me
```

### For APIs
```bash
# Health check
curl http://<project-name>.launch.me/health

# Main endpoint
curl http://<project-name>.launch.me/

# POST request
curl -X POST http://<project-name>.launch.me/items \
  -H "Content-Type: application/json" \
  -d '{"text":"Test item"}'
```

### In Browser
Simply navigate to:
```
http://<project-name>.launch.me
```

## Tips

1. **Port Configuration**: Always listen on port 80 in your application (or use `PORT` env var)
2. **Host Binding**: Bind to `0.0.0.0`, not `localhost` or `127.0.0.1`
3. **Health Checks**: Include a `/health` endpoint for monitoring
4. **Logging**: Use console.log/print statements - they appear in container logs
5. **Environment Variables**: Access via `process.env` (Node.js) or `os.getenv()` (Python)

## Troubleshooting Examples

### Application Won't Start

Check the logs in the UI or via API:
```bash
curl http://localhost:8000/api/projects/1/logs
```

Common issues:
- Wrong port (must be 80 or use PORT env var)
- Missing dependencies (check requirements.txt/package.json)
- Incorrect launch command
- Application crashes on startup

### Cannot Access Deployed App

1. Check project status is "running"
2. Verify Nginx configuration was created
3. Test locally: `curl http://localhost:<port>` (for serverside)
4. Check DNS is configured correctly
5. Review Nginx logs: `sudo tail -f /var/log/nginx/error.log`

## Creating Your Own Examples

When creating test projects:

1. **Keep it simple**: Start with minimal dependencies
2. **Use standard ports**: Listen on port 80 or read from PORT env var
3. **Add health checks**: Include a `/health` endpoint
4. **Log everything**: Use console output for debugging
5. **Test locally first**: Ensure it runs before deploying

## Next Steps

After testing these examples:

1. Deploy your own applications
2. Customize the Dockerfile generation in `backend/services/project_service.py`
3. Add support for more frameworks
4. Implement environment variables per project
5. Add database provisioning
