#!/bin/bash

# Reset Projects - Wipe out all existing projects
# WARNING: This will delete all projects, containers, and data!

set -e

echo "=========================================="
echo "PaaS Projects Reset"
echo "=========================================="
echo ""
echo "WARNING: This will:"
echo "  - Stop and remove all project containers"
echo "  - Delete all project files"
echo "  - Clear the database"
echo "  - Remove all Nginx configurations"
echo ""
read -p "Are you sure you want to continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Reset cancelled."
    exit 0
fi

echo ""
read -p "Type 'DELETE ALL PROJECTS' to confirm: " FINAL_CONFIRM

if [ "$FINAL_CONFIRM" != "DELETE ALL PROJECTS" ]; then
    echo "Reset cancelled."
    exit 0
fi

echo ""
echo "Starting reset process..."

# Determine project directory
if [ -d "/opt/paas" ]; then
    PROJECT_DIR="/opt/paas"
    DATA_DIR="$PROJECT_DIR/data"
    NGINX_CONFIG_PATH="/etc/nginx/sites-enabled"
else
    PROJECT_DIR="$(pwd)"
    DATA_DIR="$PROJECT_DIR/data"
    NGINX_CONFIG_PATH="$PROJECT_DIR/nginx-configs"
fi

# Stop all paas containers
echo "Stopping all PaaS containers..."
docker ps -a --filter "name=paas-" --format "{{.Names}}" | while read container; do
    echo "  Stopping $container..."
    docker stop "$container" 2>/dev/null || true
    echo "  Removing $container..."
    docker rm "$container" 2>/dev/null || true
done

# Remove all paas images
echo "Removing PaaS Docker images..."
docker images --filter "reference=paas-*" --format "{{.Repository}}:{{.Tag}}" | while read image; do
    echo "  Removing $image..."
    docker rmi "$image" 2>/dev/null || true
done

# Remove project files
if [ -d "$DATA_DIR/projects" ]; then
    echo "Removing project files..."
    rm -rf "$DATA_DIR/projects"/*
    echo "  Project files removed"
fi

# Remove database
if [ -f "$DATA_DIR/paas.db" ]; then
    echo "Removing database..."
    rm -f "$DATA_DIR/paas.db"
    rm -f "$DATA_DIR/paas.db-shm"
    rm -f "$DATA_DIR/paas.db-wal"
    echo "  Database removed"
fi

# Remove Nginx configurations
echo "Removing Nginx configurations..."
if [ -d "$NGINX_CONFIG_PATH" ]; then
    find "$NGINX_CONFIG_PATH" -name "*.conf" -type f ! -name "paas.conf" -delete 2>/dev/null || true
    echo "  Nginx configs removed"
fi

# Reload Nginx
if command -v nginx &> /dev/null; then
    echo "Reloading Nginx..."
    nginx -t && nginx -s reload
    echo "  Nginx reloaded"
fi

# Recreate empty directories
mkdir -p "$DATA_DIR/projects"

echo ""
echo "=========================================="
echo "Reset Complete!"
echo "=========================================="
echo "All projects have been removed."
echo "The system is ready for new deployments."
echo ""
echo "Summary:"
echo "  - Containers: Stopped and removed"
echo "  - Images: Removed"
echo "  - Project files: Deleted"
echo "  - Database: Cleared"
echo "  - Nginx configs: Removed"
