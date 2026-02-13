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
    nginx \
    python3 \
    python3-pip \
    python3-venv \
    nodejs \
    npm

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

# Create project directory
PROJECT_DIR="/opt/paas"
echo "Creating project directory at $PROJECT_DIR..."
mkdir -p $PROJECT_DIR
cd $PROJECT_DIR

# Clone or copy project files
echo "Setting up project files..."
# Note: You should either clone from git or copy files here
# git clone <your-repo-url> .

# Set up backend
echo "Setting up backend..."
cd $PROJECT_DIR/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Create .env file
if [ ! -f .env ]; then
    cp .env.example .env
    echo "Created .env file. Please configure it with your settings."
fi

# Create data directories
mkdir -p $PROJECT_DIR/data/projects
mkdir -p $PROJECT_DIR/nginx-configs

# Set up frontend
echo "Setting up frontend..."
cd $PROJECT_DIR/frontend
npm install
npm run build

# Configure Nginx
echo "Configuring Nginx..."
cp $PROJECT_DIR/nginx/paas.conf /etc/nginx/sites-available/paas
ln -sf /etc/nginx/sites-available/paas /etc/nginx/sites-enabled/paas

# Test Nginx configuration
nginx -t

# Reload Nginx
systemctl reload nginx

# Create systemd service for backend
echo "Creating systemd service..."
cat > /etc/systemd/system/paas-backend.service <<EOF
[Unit]
Description=PaaS Backend API
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$PROJECT_DIR/backend
Environment="PATH=$PROJECT_DIR/backend/venv/bin"
ExecStart=$PROJECT_DIR/backend/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# Create systemd service for frontend
cat > /etc/systemd/system/paas-frontend.service <<EOF
[Unit]
Description=PaaS Frontend UI
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$PROJECT_DIR/frontend
Environment="NEXT_PUBLIC_API_URL=http://localhost:8000"
ExecStart=/usr/bin/npm start
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd
systemctl daemon-reload

# Enable and start services
echo "Starting services..."
systemctl enable paas-backend
systemctl start paas-backend

systemctl enable paas-frontend
systemctl start paas-frontend

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
echo "2. Set up wildcard DNS (*.launch.me) to point to this server"
echo "3. Edit $PROJECT_DIR/backend/.env with your settings"
echo "4. Restart services: systemctl restart paas-backend paas-frontend"
echo "5. Access the UI at http://launch.me"
echo ""
echo "Service status:"
systemctl status paas-backend --no-pager
systemctl status paas-frontend --no-pager
