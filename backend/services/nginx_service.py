import os
import subprocess
import logging
from typing import Optional
from config import settings

logger = logging.getLogger(__name__)


class NginxService:
    def __init__(self):
        self.config_path = settings.nginx_config_path
        os.makedirs(self.config_path, exist_ok=True)

    def create_static_config(self, subdomain: str, root_path: str) -> bool:
        """Create Nginx configuration for a static site"""
        config_file = os.path.join(self.config_path, f"{subdomain}.conf")
        
        config_content = f"""server {{
    listen 80;
    server_name {subdomain}.{settings.domain};

    root {root_path};
    index index.html index.htm;

    location / {{
        try_files $uri $uri/ /index.html;
    }}

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;

    # Cache static assets
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {{
        expires 1y;
        add_header Cache-Control "public, immutable";
    }}
}}
"""
        
        try:
            with open(config_file, 'w') as f:
                f.write(config_content)
            logger.info(f"Created Nginx config for {subdomain}")
            return self.reload_nginx()
        except Exception as e:
            logger.error(f"Failed to create Nginx config: {e}")
            return False

    def create_proxy_config(self, subdomain: str, port: int) -> bool:
        """Create Nginx configuration for a reverse proxy"""
        config_file = os.path.join(self.config_path, f"{subdomain}.conf")
        
        config_content = f"""server {{
    listen 80;
    server_name {subdomain}.{settings.domain};

    location / {{
        proxy_pass http://localhost:{port};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }}

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}}
"""
        
        try:
            with open(config_file, 'w') as f:
                f.write(config_content)
            logger.info(f"Created Nginx proxy config for {subdomain} -> port {port}")
            return self.reload_nginx()
        except Exception as e:
            logger.error(f"Failed to create Nginx proxy config: {e}")
            return False

    def remove_config(self, subdomain: str) -> bool:
        """Remove Nginx configuration"""
        config_file = os.path.join(self.config_path, f"{subdomain}.conf")
        
        try:
            if os.path.exists(config_file):
                os.remove(config_file)
                logger.info(f"Removed Nginx config for {subdomain}")
                return self.reload_nginx()
            return True
        except Exception as e:
            logger.error(f"Failed to remove Nginx config: {e}")
            return False

    def reload_nginx(self) -> bool:
        """Reload Nginx configuration"""
        try:
            # Test configuration first
            result = subprocess.run(
                ["nginx", "-t"],
                capture_output=True,
                text=True
            )
            
            if result.returncode != 0:
                logger.error(f"Nginx config test failed: {result.stderr}")
                return False
            
            # Reload Nginx
            result = subprocess.run(
                ["nginx", "-s", "reload"],
                capture_output=True,
                text=True
            )
            
            if result.returncode == 0:
                logger.info("Nginx reloaded successfully")
                return True
            else:
                logger.error(f"Nginx reload failed: {result.stderr}")
                return False
        except FileNotFoundError:
            logger.warning("Nginx command not found, skipping reload")
            return True  # Don't fail if nginx is not installed (dev environment)
        except Exception as e:
            logger.error(f"Failed to reload Nginx: {e}")
            return False

    def test_config(self) -> bool:
        """Test Nginx configuration"""
        try:
            result = subprocess.run(
                ["nginx", "-t"],
                capture_output=True,
                text=True
            )
            return result.returncode == 0
        except Exception as e:
            logger.error(f"Failed to test Nginx config: {e}")
            return False
