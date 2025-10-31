#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Production Deployment Script');
console.log('=' .repeat(50));

// Configuration
const config = {
  buildDir: 'dist',
  serverDir: 'server',
  deploymentDir: 'deployment',
  productionEnv: {
    NODE_ENV: 'production',
    PORT: process.env.PORT || 5000,
    MONGODB_URI: process.env.MONGODB_URI,
    JWT_SECRET: process.env.JWT_SECRET,
    PAYPAL_MODE: 'live', // Switch to live for production
    PAYPAL_CLIENT_ID: process.env.PAYPAL_CLIENT_ID_LIVE,
    PAYPAL_CLIENT_SECRET: process.env.PAYPAL_CLIENT_SECRET_LIVE,
    CLIENT_URL: process.env.CLIENT_URL || 'https://your-domain.com',
    EMAIL_USER: process.env.EMAIL_USER,
    EMAIL_PASS: process.env.EMAIL_PASS,
  }
};

// Helper functions
const runCommand = (command, description) => {
  console.log(`\n📦 ${description}...`);
  try {
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ ${description} completed`);
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message);
    process.exit(1);
  }
};

const createDirectory = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 Created directory: ${dir}`);
  }
};

const copyFile = (src, dest) => {
  fs.copyFileSync(src, dest);
  console.log(`📄 Copied: ${src} → ${dest}`);
};

const copyDirectory = (src, dest) => {
  createDirectory(dest);
  const items = fs.readdirSync(src);
  
  items.forEach(item => {
    const srcPath = path.join(src, item);
    const destPath = path.join(dest, item);
    
    if (fs.statSync(srcPath).isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      copyFile(srcPath, destPath);
    }
  });
};

const createProductionEnv = () => {
  console.log('\n🔧 Creating production environment file...');
  
  const envContent = Object.entries(config.productionEnv)
    .map(([key, value]) => `${key}=${value || ''}`)
    .join('\n');
  
  const envPath = path.join(config.deploymentDir, '.env');
  fs.writeFileSync(envPath, envContent);
  console.log(`✅ Production .env created at ${envPath}`);
};

const createDockerfile = () => {
  console.log('\n🐳 Creating Dockerfile...');
  
  const dockerfile = `# Multi-stage build for production
FROM node:18-alpine AS frontend-build

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build frontend
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app directory
WORKDIR /app

# Copy server package files
COPY server/package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy server source
COPY server/ ./

# Copy built frontend
COPY --from=frontend-build /app/dist ./public

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD node healthcheck.js

# Start application
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
`;

  const dockerfilePath = path.join(config.deploymentDir, 'Dockerfile');
  fs.writeFileSync(dockerfilePath, dockerfile);
  console.log(`✅ Dockerfile created at ${dockerfilePath}`);
};

const createDockerCompose = () => {
  console.log('\n🐳 Creating docker-compose.yml...');
  
  const dockerCompose = `version: '3.8'

services:
  app:
    build: .
    ports:
      - "\${PORT:-5000}:5000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=\${MONGODB_URI}
      - JWT_SECRET=\${JWT_SECRET}
      - PAYPAL_CLIENT_ID=\${PAYPAL_CLIENT_ID}
      - PAYPAL_CLIENT_SECRET=\${PAYPAL_CLIENT_SECRET}
      - EMAIL_USER=\${EMAIL_USER}
      - EMAIL_PASS=\${EMAIL_PASS}
    depends_on:
      - mongodb
    restart: unless-stopped
    networks:
      - app-network

  mongodb:
    image: mongo:6.0
    environment:
      - MONGO_INITDB_ROOT_USERNAME=\${MONGO_ROOT_USERNAME:-admin}
      - MONGO_INITDB_ROOT_PASSWORD=\${MONGO_ROOT_PASSWORD:-password}
    volumes:
      - mongodb_data:/data/db
    ports:
      - "27017:27017"
    restart: unless-stopped
    networks:
      - app-network

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped
    networks:
      - app-network

volumes:
  mongodb_data:

networks:
  app-network:
    driver: bridge
`;

  const composePath = path.join(config.deploymentDir, 'docker-compose.yml');
  fs.writeFileSync(composePath, dockerCompose);
  console.log(`✅ docker-compose.yml created at ${composePath}`);
};

const createNginxConfig = () => {
  console.log('\n🌐 Creating Nginx configuration...');
  
  const nginxConfig = `events {
    worker_connections 1024;
}

http {
    upstream app {
        server app:5000;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;

    server {
        listen 80;
        server_name your-domain.com www.your-domain.com;
        
        # Redirect HTTP to HTTPS
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name your-domain.com www.your-domain.com;

        # SSL Configuration
        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
        ssl_prefer_server_ciphers off;

        # Security headers
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";
        add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";

        # Gzip compression
        gzip on;
        gzip_vary on;
        gzip_min_length 1024;
        gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

        # API routes
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://app;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        # Socket.IO
        location /socket.io/ {
            proxy_pass http://app;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Static files
        location / {
            proxy_pass http://app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
`;

  const nginxPath = path.join(config.deploymentDir, 'nginx.conf');
  fs.writeFileSync(nginxPath, nginxConfig);
  console.log(`✅ Nginx config created at ${nginxPath}`);
};

const createHealthCheck = () => {
  console.log('\n🏥 Creating health check script...');
  
  const healthCheck = `const http = require('http');

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/health',
  method: 'GET',
  timeout: 3000
};

const req = http.request(options, (res) => {
  if (res.statusCode === 200) {
    process.exit(0);
  } else {
    process.exit(1);
  }
});

req.on('error', () => {
  process.exit(1);
});

req.on('timeout', () => {
  req.destroy();
  process.exit(1);
});

req.end();
`;

  const healthCheckPath = path.join(config.deploymentDir, 'healthcheck.js');
  fs.writeFileSync(healthCheckPath, healthCheck);
  console.log(`✅ Health check script created at ${healthCheckPath}`);
};

const createDeploymentScript = () => {
  console.log('\n📜 Creating deployment script...');
  
  const deployScript = `#!/bin/bash

echo "🚀 Deploying Fashion Era E-commerce Platform..."

# Pull latest changes
git pull origin main

# Build and deploy with Docker Compose
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 30

# Health check
if curl -f http://localhost:5000/health; then
    echo "✅ Deployment successful!"
    echo "🌐 Application is running at http://localhost"
else
    echo "❌ Deployment failed - health check failed"
    docker-compose logs
    exit 1
fi
`;

  const deployScriptPath = path.join(config.deploymentDir, 'deploy.sh');
  fs.writeFileSync(deployScriptPath, deployScript);
  fs.chmodSync(deployScriptPath, '755');
  console.log(`✅ Deployment script created at ${deployScriptPath}`);
};

// Main deployment process
const main = async () => {
  try {
    console.log('🔍 Pre-deployment checks...');
    
    // Check if required environment variables are set
    const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.log('❌ Missing required environment variables:', missingVars.join(', '));
      console.log('Please set these variables before deployment.');
      process.exit(1);
    }
    
    // Create deployment directory
    createDirectory(config.deploymentDir);
    
    // Build frontend
    runCommand('npm run build', 'Building frontend');
    
    // Install production dependencies
    runCommand('npm ci --only=production', 'Installing production dependencies');
    runCommand('cd server && npm ci --only=production', 'Installing server dependencies');
    
    // Copy server files
    console.log('\n📁 Copying server files...');
    copyDirectory(config.serverDir, path.join(config.deploymentDir, 'server'));
    
    // Copy built frontend
    console.log('\n📁 Copying built frontend...');
    copyDirectory(config.buildDir, path.join(config.deploymentDir, 'dist'));
    
    // Create production files
    createProductionEnv();
    createDockerfile();
    createDockerCompose();
    createNginxConfig();
    createHealthCheck();
    createDeploymentScript();
    
    console.log('\n🎉 Production deployment package created successfully!');
    console.log('📁 Deployment files are in:', config.deploymentDir);
    console.log('\n📋 Next steps:');
    console.log('1. Review and update the .env file with production values');
    console.log('2. Add SSL certificates to the ssl/ directory');
    console.log('3. Update nginx.conf with your domain name');
    console.log('4. Run: cd deployment && ./deploy.sh');
    
  } catch (error) {
    console.error('❌ Deployment preparation failed:', error.message);
    process.exit(1);
  }
};

// Run deployment
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main };
