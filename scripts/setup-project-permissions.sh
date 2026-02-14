#!/bin/bash

# setup-project-permissions.sh
# Usage: ./setup-project-permissions.sh <project_dir>

PROJECT_DIR=$1

if [ -z "$PROJECT_DIR" ]; then
    echo "Error: Project directory not specified."
    echo "Usage: $0 <project_dir>"
    exit 1
fi

if [ ! -d "$PROJECT_DIR" ]; then
    echo "Error: Directory does not exist: $PROJECT_DIR"
    exit 1
fi

echo "Setting up permissions for: $PROJECT_DIR"

# Set directory permissions to 755 (rwxr-xr-x)
echo "Setting directory permissions to 755..."
find "$PROJECT_DIR" -type d -exec chmod 755 {} \;

# Set file permissions to 644 (rw-r--r--)
echo "Setting file permissions to 644..."
find "$PROJECT_DIR" -type f -exec chmod 644 {} \;

# Change ownership to www-data:www-data
# This requires sudo or running as root if the current user is not owner/doesn't have privs
echo "Changing ownership to www-data:www-data..."
if chown -R www-data:www-data "$PROJECT_DIR"; then
    echo "✓ Ownership changed to www-data:www-data"
else
    echo "⚠ Failed to change ownership to www-data:www-data. Trying to make world-readable as fallback..."
    chmod -R a+rX "$PROJECT_DIR"
    echo "✓ Files are now world-readable"
fi

echo "✓ Permissions setup complete for $PROJECT_DIR"
