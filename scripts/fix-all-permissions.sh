#!/bin/bash

# Fix Permissions for All Existing Projects
# Run this after updating the code to fix existing projects

set -e

echo "=========================================="
echo "Fixing Permissions for All Projects"
echo "=========================================="

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "Please run as root (use sudo)"
    exit 1
fi

PROJECTS_DIR="/opt/paas/data/projects"

if [ ! -d "$PROJECTS_DIR" ]; then
    echo "Projects directory not found: $PROJECTS_DIR"
    exit 1
fi

# Count projects
PROJECT_COUNT=$(find "$PROJECTS_DIR" -mindepth 1 -maxdepth 1 -type d | wc -l)
echo "Found $PROJECT_COUNT project(s)"
echo ""

if [ "$PROJECT_COUNT" -eq 0 ]; then
    echo "No projects to fix"
    exit 0
fi

# Fix each project
for PROJECT_DIR in "$PROJECTS_DIR"/*; do
    if [ -d "$PROJECT_DIR" ]; then
        PROJECT_NAME=$(basename "$PROJECT_DIR")
        echo "Fixing: $PROJECT_NAME"
        
        # Set directory permissions to 755
        find "$PROJECT_DIR" -type d -exec chmod 755 {} \;
        echo "  ✓ Directory permissions: 755"
        
        # Set file permissions to 644
        find "$PROJECT_DIR" -type f -exec chmod 644 {} \;
        echo "  ✓ File permissions: 644"
        
        # Change ownership to www-data
        chown -R www-data:www-data "$PROJECT_DIR"
        echo "  ✓ Ownership: www-data:www-data"
        
        echo ""
    fi
done

# Fix base directories
echo "Fixing base directories..."
chmod 755 "$PROJECTS_DIR"
chown www-data:www-data "$PROJECTS_DIR"
echo "  ✓ Base directory fixed"
echo ""

# Reload Nginx
echo "Reloading Nginx..."
nginx -s reload
echo "  ✓ Nginx reloaded"
echo ""

echo "=========================================="
echo "All Permissions Fixed!"
echo "=========================================="
echo ""
echo "Summary:"
echo "  - Fixed $PROJECT_COUNT project(s)"
echo "  - All directories: 755 (rwxr-xr-x)"
echo "  - All files: 644 (rw-r--r--)"
echo "  - Owner: www-data:www-data"
echo ""
echo "Test your projects:"
for PROJECT_DIR in "$PROJECTS_DIR"/*; do
    if [ -d "$PROJECT_DIR" ]; then
        PROJECT_NAME=$(basename "$PROJECT_DIR")
        echo "  curl http://$PROJECT_NAME.ivibe.site"
    fi
done
