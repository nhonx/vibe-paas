#!/bin/bash

# Development environment startup script

set -e

echo "Starting PaaS in development mode..."

# Create data directories
mkdir -p data/projects
mkdir -p nginx-configs

# Start application
echo "Starting Next.js application..."
cd frontend

if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Create .env.local if it doesn't exist
if [ ! -f .env.local ]; then
    cat > .env.local <<EOF
DOMAIN=launch.me
NGINX_CONFIG_PATH=../nginx-configs
PROJECTS_BASE_PATH=../data/projects
PORT_RANGE_START=10000
PORT_RANGE_END=20000
EOF
fi

npm run dev &
APP_PID=$!
cd ..

echo ""
echo "=========================================="
echo "PaaS Development Environment Running"
echo "=========================================="
echo "Application: http://localhost:3000"
echo "API: http://localhost:3000/api"
echo ""
echo "Press Ctrl+C to stop"
echo "=========================================="

# Wait for Ctrl+C
trap "kill $APP_PID; exit" INT
wait
