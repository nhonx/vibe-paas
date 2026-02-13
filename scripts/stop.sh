#!/bin/bash

# Stop PaaS services

set -e

echo "Stopping PaaS services..."

# Stop backend
echo "Stopping backend..."
systemctl stop paas-backend

# Stop frontend
echo "Stopping frontend..."
systemctl stop paas-frontend

echo ""
echo "PaaS services stopped successfully!"
