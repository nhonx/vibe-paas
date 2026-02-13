import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const NGINX_CONFIG_PATH = process.env.NGINX_CONFIG_PATH || '/etc/nginx/sites-enabled';
const DOMAIN = process.env.DOMAIN || 'launch.me';

export const nginxService = {
  createStaticConfig(subdomain: string, rootPath: string): boolean {
    try {
      const configFile = path.join(NGINX_CONFIG_PATH, `${subdomain}.conf`);
      
      console.log(`Creating static Nginx config for ${subdomain}.${DOMAIN}`);
      console.log(`Config file: ${configFile}`);
      console.log(`Root path: ${rootPath}`);
      
      const config = `server {
    listen 80;
    server_name ${subdomain}.${DOMAIN};

    root ${rootPath};
    index index.html index.htm;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;

    # Cache static assets
    location ~* \\.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
`;

      // Check if directory exists and is writable
      if (!fs.existsSync(NGINX_CONFIG_PATH)) {
        console.error(`Nginx config path does not exist: ${NGINX_CONFIG_PATH}`);
        return false;
      }

      // Write config file
      fs.writeFileSync(configFile, config, { mode: 0o644 });
      console.log(`✓ Config file written: ${configFile}`);
      
      // Verify file was created
      if (!fs.existsSync(configFile)) {
        console.error(`Failed to create config file: ${configFile}`);
        return false;
      }
      
      return this.reloadNginx();
    } catch (error: any) {
      console.error('Failed to create static config:', error.message);
      console.error('Stack:', error.stack);
      return false;
    }
  },

  createProxyConfig(subdomain: string, port: number): boolean {
    try {
      const configFile = path.join(NGINX_CONFIG_PATH, `${subdomain}.conf`);
      
      console.log(`Creating proxy Nginx config for ${subdomain}.${DOMAIN} -> port ${port}`);
      console.log(`Config file: ${configFile}`);
      
      const config = `server {
    listen 80;
    server_name ${subdomain}.${DOMAIN};

    location / {
        proxy_pass http://localhost:${port};
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
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
`;

      // Check if directory exists and is writable
      if (!fs.existsSync(NGINX_CONFIG_PATH)) {
        console.error(`Nginx config path does not exist: ${NGINX_CONFIG_PATH}`);
        return false;
      }

      // Write config file
      fs.writeFileSync(configFile, config, { mode: 0o644 });
      console.log(`✓ Config file written: ${configFile}`);
      
      // Verify file was created
      if (!fs.existsSync(configFile)) {
        console.error(`Failed to create config file: ${configFile}`);
        return false;
      }
      
      return this.reloadNginx();
    } catch (error: any) {
      console.error('Failed to create proxy config:', error.message);
      console.error('Stack:', error.stack);
      return false;
    }
  },

  removeConfig(subdomain: string): boolean {
    try {
      const configFile = path.join(NGINX_CONFIG_PATH, `${subdomain}.conf`);
      if (fs.existsSync(configFile)) {
        fs.unlinkSync(configFile);
        return this.reloadNginx();
      }
      return true;
    } catch (error) {
      console.error('Failed to remove config:', error);
      return false;
    }
  },

  reloadNginx(): boolean {
    try {
      // Test config first
      const testResult = execSync('nginx -t 2>&1', { encoding: 'utf-8' });
      console.log('Nginx test:', testResult);
      
      // Reload
      execSync('nginx -s reload', { stdio: 'pipe' });
      console.log('Nginx reloaded successfully');
      return true;
    } catch (error: any) {
      console.error('Nginx reload failed:', error.message);
      // Check if it's a dev environment
      if (!fs.existsSync('/etc/nginx')) {
        console.warn('Nginx not installed (dev environment), skipping reload');
        return true;
      }
      return false;
    }
  }
};
