#!/bin/bash

# PaaS Installation Script
# This script sets up the PaaS system on a fresh Ubuntu/Debian VPS

set -e

echo "=========================================="
echo "PaaS Installation Script"
echo "=========================================="

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "Please run as root (use sudo)"
    exit 1
fi




# Update system
echo "Updating system packages..."
apt-get update
apt-get upgrade -y

# Install dependencies
echo "Installing dependencies..."
apt-get install -y \
    curl \
    wget \
    git \
    nginx

# Check for Node.js
if command -v node &> /dev/null; then
    echo "Node.js already installed: $(node -v)"
else
    echo "Node.js not found. Installing..."
    # Install Node.js 18
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
fi


# Check for Docker
if command -v docker &> /dev/null; then
    echo "Docker already installed: $(docker --version)"
else
    echo "Docker not found. Installing..."
        # Install Docker
    echo "Installing Docker..."
    if ! command -v docker &> /dev/null; then
        curl -fsSL https://get.docker.com -o get-docker.sh
        sh get-docker.sh
        rm get-docker.sh
        systemctl enable docker
        systemctl start docker
    else
        echo "Docker already installed"
    fi

    # Install Docker Compose
    echo "Installing Docker Compose..."
    if ! command -v docker-compose &> /dev/null; then
        curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        chmod +x /usr/local/bin/docker-compose
    else
        echo "Docker Compose already installed"
    fi
fi
# Create project directory
PROJECT_DIR="/opt/paas"
echo "Creating project directory at $PROJECT_DIR..."
mkdir -p $PROJECT_DIR
mkdir -p $PROJECT_DIR/frontend
mkdir -p $PROJECT_DIR/nginx
cp -r $(pwd)/frontend/* $PROJECT_DIR/frontend/
cp -r $(pwd)/nginx/* $PROJECT_DIR/nginx/
cd $PROJECT_DIR


# Clone or copy project files
echo "Setting up project files..."
# Note: You should either clone from git or copy files here
# git clone <your-repo-url> .

# Create data directories
mkdir -p $PROJECT_DIR/data/projects
mkdir -p $PROJECT_DIR/nginx-configs

# Set up application
echo "Setting up Next.js application..."
cd $PROJECT_DIR/frontend
npm install
npm run build

# Create .env.local file
if [ ! -f .env.local ]; then
    cat > .env.local <<EOF
DOMAIN=ivibe.site
NGINX_CONFIG_PATH=/etc/nginx/sites-enabled
PROJECTS_BASE_PATH=$PROJECT_DIR/data/projects
PORT_RANGE_START=10000
PORT_RANGE_END=20000
EOF
    echo "Created .env.local file."
fi

# Configure Nginx
echo "Configuring Nginx..."
cp $PROJECT_DIR/nginx/paas.conf /etc/nginx/sites-available/paas
ln -sf /etc/nginx/sites-available/paas /etc/nginx/sites-enabled/paas

# Test Nginx configuration
nginx -t

# Reload Nginx
systemctl reload nginx

# Create systemd service
echo "Creating systemd service..."
cat > /etc/systemd/system/paas.service <<EOF
[Unit]
Description=PaaS Application
After=network.target docker.service
Requires=docker.service

[Service]
Type=simple
User=root
WorkingDirectory=$PROJECT_DIR/frontend
ExecStart=/usr/bin/npm start
Restart=always
Environment="NODE_ENV=production"

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd
systemctl daemon-reload

# Enable and start service
echo "Starting service..."
systemctl enable paas
systemctl start paas

# Configure firewall (if ufw is installed)
if command -v ufw &> /dev/null; then
    echo "Configuring firewall..."
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw allow 22/tcp
fi

echo "=========================================="
echo "Installation complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Configure your domain's DNS to point to this server"
echo "2. Set up wildcard DNS (*.ivibe.site) to point to this server"
echo "3. Edit $PROJECT_DIR/frontend/.env.local with your settings"
echo "4. Restart service: systemctl restart paas"
echo "5. Access the UI at http://ivibe.site"
echo ""
echo "Service status:"
systemctl status paas --no-pager
