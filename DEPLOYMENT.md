# Deployment Guide

This guide will help you deploy the PaaS system on a VPS.

## Prerequisites

- Ubuntu 20.04+ or Debian 11+ VPS
- Root access
- Domain name with DNS access
- At least 2GB RAM and 20GB storage

## DNS Configuration

Before deploying, configure your domain's DNS:

1. Add an A record pointing your domain to your VPS IP:
   ```
   ivibe.site → YOUR_VPS_IP
   ```

2. Add a wildcard A record for subdomains:
   ```
   *.ivibe.site → YOUR_VPS_IP
   ```

This allows the system to route `app1.ivibe.site`, `app2.ivibe.site`, etc. to your VPS.

## Installation Methods

### Method 1: Automated Installation (Recommended)

1. SSH into your VPS:
   ```bash
   ssh root@your-vps-ip
   ```

2. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd paas
   ```

3. Run the installation script:
   ```bash
   chmod +x scripts/install.sh
   sudo ./scripts/install.sh
   ```

4. Configure your environment:
   ```bash
   nano /opt/paas/backend/.env
   ```
   
   Update the following variables:
   ```
   DOMAIN=ivibe.site
   NGINX_CONFIG_PATH=/etc/nginx/sites-enabled
   PROJECTS_BASE_PATH=/opt/paas/data/projects
   ```

5. Restart services:
   ```bash
   sudo systemctl restart paas-backend
   sudo systemctl restart paas-frontend
   ```

### Method 2: Docker Compose

1. SSH into your VPS and clone the repository:
   ```bash
   git clone <your-repo-url>
   cd paas
   ```

2. Create environment file:
   ```bash
   cp backend/.env.example backend/.env
   nano backend/.env
   ```

3. Start with Docker Compose:
   ```bash
   docker-compose up -d
   ```

4. Configure Nginx on the host to proxy to the containers:
   ```bash
   sudo cp nginx/paas.conf /etc/nginx/sites-available/paas
   sudo ln -s /etc/nginx/sites-available/paas /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

## Post-Installation

### 1. Verify Services

Check that all services are running:

```bash
# Check backend
curl http://localhost:8000/api/health

# Check frontend
curl http://localhost:3000

# Check Nginx
sudo systemctl status nginx
```

### 2. Configure SSL (Optional but Recommended)

Install Certbot for Let's Encrypt SSL:

```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d ivibe.site -d *.ivibe.site
```

Note: Wildcard certificates require DNS validation.

### 3. Set Up Firewall

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 4. Configure Automatic Backups

Create a backup script:

```bash
sudo nano /opt/paas/scripts/backup.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/opt/paas/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup database
cp /opt/paas/data/paas.db $BACKUP_DIR/paas_$DATE.db

# Backup project files
tar -czf $BACKUP_DIR/projects_$DATE.tar.gz /opt/paas/data/projects

# Keep only last 7 days of backups
find $BACKUP_DIR -type f -mtime +7 -delete
```

Add to crontab:

```bash
sudo crontab -e
```

Add line:
```
0 2 * * * /opt/paas/scripts/backup.sh
```

## Managing the System

### Start Services

```bash
sudo systemctl start paas-backend
sudo systemctl start paas-frontend
```

Or use the script:
```bash
sudo ./scripts/start.sh
```

### Stop Services

```bash
sudo systemctl stop paas-backend
sudo systemctl stop paas-frontend
```

Or use the script:
```bash
sudo ./scripts/stop.sh
```

### View Logs

```bash
# Backend logs
sudo journalctl -u paas-backend -f

# Frontend logs
sudo journalctl -u paas-frontend -f

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Restart Services

```bash
sudo systemctl restart paas-backend
sudo systemctl restart paas-frontend
sudo systemctl reload nginx
```

## Troubleshooting

### Backend won't start

1. Check logs:
   ```bash
   sudo journalctl -u paas-backend -n 50
   ```

2. Verify Python environment:
   ```bash
   cd /opt/paas/backend
   source venv/bin/activate
   python -c "import fastapi; print('OK')"
   ```

3. Check database permissions:
   ```bash
   ls -la /opt/paas/data/
   ```

### Frontend won't start

1. Check logs:
   ```bash
   sudo journalctl -u paas-frontend -n 50
   ```

2. Verify Node.js installation:
   ```bash
   node --version
   npm --version
   ```

3. Rebuild frontend:
   ```bash
   cd /opt/paas/frontend
   npm install
   npm run build
   ```

### Docker containers won't start

1. Check Docker status:
   ```bash
   sudo systemctl status docker
   ```

2. Check Docker socket permissions:
   ```bash
   ls -la /var/run/docker.sock
   sudo chmod 666 /var/run/docker.sock
   ```

3. View Docker logs:
   ```bash
   docker logs <container-id>
   ```

### Nginx configuration errors

1. Test configuration:
   ```bash
   sudo nginx -t
   ```

2. Check syntax of generated configs:
   ```bash
   ls -la /etc/nginx/sites-enabled/
   cat /etc/nginx/sites-enabled/*.conf
   ```

3. Reload Nginx:
   ```bash
   sudo systemctl reload nginx
   ```

## Security Best Practices

1. **Use SSL/TLS**: Always use HTTPS in production
2. **Firewall**: Configure UFW or iptables
3. **Authentication**: Add authentication to the UI (not included in base system)
4. **Updates**: Keep system packages updated
5. **Backups**: Regular automated backups
6. **Monitoring**: Set up monitoring and alerts
7. **Resource Limits**: Configure Docker resource limits
8. **User Permissions**: Run services with appropriate user permissions

## Upgrading

To upgrade the system:

```bash
cd /opt/paas
git pull
sudo systemctl stop paas-backend paas-frontend
cd backend && source venv/bin/activate && pip install -r requirements.txt
cd ../frontend && npm install && npm run build
sudo systemctl start paas-backend paas-frontend
```

## Uninstallation

To completely remove the system:

```bash
sudo systemctl stop paas-backend paas-frontend
sudo systemctl disable paas-backend paas-frontend
sudo rm /etc/systemd/system/paas-*.service
sudo systemctl daemon-reload
sudo rm -rf /opt/paas
sudo rm /etc/nginx/sites-enabled/paas
sudo systemctl reload nginx
```
