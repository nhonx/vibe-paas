#!/bin/bash

# Start PaaS service

set -e

echo "Starting PaaS service..."

systemctl start paas

# Check status
echo ""
echo "Service status:"
systemctl status paas --no-pager

echo ""
echo "PaaS service started successfully!"
