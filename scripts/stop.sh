#!/bin/bash

# Stop PaaS service

set -e

echo "Stopping PaaS service..."

systemctl stop paas

echo ""
echo "PaaS service stopped successfully!"
