#!/bin/bash

# Start PaaS services

set -e

echo "Starting PaaS services..."

# Start backend
echo "Starting backend..."
systemctl start paas-backend

# Start frontend
echo "Starting frontend..."
systemctl start paas-frontend

# Check status
echo ""
echo "Service status:"
systemctl status paas-backend --no-pager
systemctl status paas-frontend --no-pager

echo ""
echo "PaaS services started successfully!"
