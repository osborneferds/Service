# 🚀 Production Deployment Guide

## Overview
This guide explains how to deploy the freelancer website as a production-ready full-stack application with server-side SQLite3 database.

---

## 📋 Prerequisites

### System Requirements
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Server**: Linux VPS, AWS EC2, DigitalOcean, or similar
- **Domain**: Registered domain name (optional but recommended)
- **SSL Certificate**: Let's Encrypt (free) or paid certificate

### Recommended Server Specs
- **CPU**: 2+ cores
- **RAM**: 2GB minimum, 4GB recommended
- **Storage**: 20GB+ SSD
- **OS**: Ubuntu 22.04 LTS or Debian 12

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         INTERNET                             │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ HTTPS (443)
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    NGINX REVERSE PROXY                       │
│  • SSL/TLS termination                                       │
│  • Load balancing (if needed)                                │
│  • Static file serving                                       │
└──────────┬─────────────────────────────────┬────────────────┘
           │                                 │
           │ /api/*                          │ /*
           ▼                                 ▼
┌──────────────────────┐          ┌──────────────────────┐
│   BACKEND SERVER     │          │   FRONTEND BUILD     │
│   (Node.js + Express)│          │   (Static Files)     │
│   Port: 3001         │          │   Served by Nginx    │
└──────────┬───────────┘          └──────────────────────┘
           │
           │ SQLite3 Queries
           ▼
┌──────────────────────┐
│   SQLite3 DATABASE   │
│   production.sqlite3 │
│   Location: /var/www/│
│   app/backend/       │
│   database/          │
└──────────────────────┘
```

---

## 📦 Installation Steps

### Step 1: Server Setup

#### 1.1 Update System
```bash
sudo apt update && sudo apt upgrade -y
```

#### 1.2 Install Node.js
```bash
# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should show v18.x.x
npm --version   # Should show 9.x.x or higher
```

#### 1.3 Install Nginx
```bash
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

#### 1.4 Install PM2 (Process Manager)
```bash
sudo npm install -g pm2
```

#### 1.5 Install Git
```bash
sudo apt install -y git
```

---

### Step 2: Application Setup

#### 2.1 Create Application Directory
```bash
sudo mkdir -p /var/www/freelancer-website
sudo chown $USER:$USER /var/www/freelancer-website
cd /var/www/freelancer-website
```

#### 2.2 Clone or Upload Your Application
```bash
# If using Git
git clone <your-repo-url> .

# Or upload via SCP/SFTP
scp -r ./backend/* user@server:/var/www/freelancer-website/backend/
scp -r ./dist/* user@server:/var/www/freelancer-website/frontend/
```

#### 2.3 Install Backend Dependencies
```bash
cd backend
npm install --production
```

#### 2.4 Configure Environment
```bash
# Copy environment template
cp .env.example .env

# Edit environment file
nano .env
```

**Production .env Configuration:**
```env
# Server Configuration
PORT=3001
NODE_ENV=production

# Database Configuration
DATABASE_PATH=./database/production.sqlite3

# JWT Configuration (GENERATE A STRONG SECRET!)
JWT_SECRET=<generate-a-strong-64-character-random-string>
JWT_EXPIRES_IN=7d

# CORS Configuration
CORS_ORIGIN=https://yourdomain.com

# File Upload Configuration
UPLOAD_DIR=./storage/uploads
MAX_FILE_SIZE=10485760

# Admin Credentials (CHANGE THESE!)
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=<strong-password-min-12-chars>

# Backup Configuration
BACKUP_DIR=./backups
BACKUP_RETENTION_DAYS=30
```

**Generate JWT Secret:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

#### 2.5 Create Required Directories
```bash
cd backend
mkdir -p database storage/uploads backups
chmod 755 database storage storage/uploads backups
```

#### 2.6 Initialize Database
```bash
npm run db:init
```

This will:
- Create the SQLite3 database file
- Create all tables and indexes
- Seed default data (admin user, demo client, sample projects)

---

### Step 3: Frontend Setup

#### 3.1 Build Frontend
```bash
cd /var/www/freelancer-website
npm run build
```

#### 3.2 Update API URL
Edit `src/config/site.ts`:
```typescript
export const siteConfig = {
  // ... other config
  api: {
    baseUrl: 'https://yourdomain.com/api'  // Change this!
  }
};
```

Then rebuild:
```bash
npm run build
```

#### 3.3 Copy Build Files
```bash
sudo mkdir -p /var/www/freelancer-website/frontend
sudo cp -r dist/* /var/www/freelancer-website/frontend/
sudo chown -R www-data:www-data /var/www/freelancer-website/frontend
```

---

### Step 4: Nginx Configuration

#### 4.1 Create Nginx Config
```bash
sudo nano /etc/nginx/sites-available/freelancer-website
```

**Nginx Configuration:**
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Frontend (Static Files)
    root /var/www/freelancer-website/frontend;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
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

    # File uploads
    location /uploads {
        alias /var/www/freelancer-website/backend/storage/uploads;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Health check
    location /health {
        proxy_pass http://localhost:3001/health;
    }

    # Logging
    access_log /var/log/nginx/freelancer-website.access.log;
    error_log /var/log/nginx/freelancer-website.error.log;
}
```

#### 4.2 Enable Site
```bash
sudo ln -s /etc/nginx/sites-available/freelancer-website /etc/nginx/sites-enabled/
sudo nginx -t  # Test configuration
sudo systemctl reload nginx
```

---

### Step 5: SSL Certificate (Let's Encrypt)

#### 5.1 Install Certbot
```bash
sudo apt install -y certbot python3-certbot-nginx
```

#### 5.2 Obtain Certificate
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Follow the prompts:
- Enter email address
- Agree to terms
- Choose to redirect HTTP to HTTPS (option 2)

#### 5.3 Auto-Renewal
Certbot automatically sets up renewal. Test it:
```bash
sudo certbot renew --dry-run
```

---

### Step 6: Start Backend with PM2

#### 6.1 Start Backend
```bash
cd /var/www/freelancer-website/backend
pm2 start server.js --name freelancer-backend
```

#### 6.2 Save PM2 Configuration
```bash
pm2 save
```

#### 6.3 Setup PM2 Startup Script
```bash
pm2 startup
# Copy and run the command that PM2 outputs
```

#### 6.4 Monitor Backend
```bash
pm2 logs freelancer-backend
pm2 status
```

---

### Step 7: Firewall Configuration

#### 7.1 Configure UFW
```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

---

### Step 8: Database Backup Setup

#### 8.1 Create Backup Script
```bash
cd /var/www/freelancer-website/backend
nano scripts/backup.sh
```

**Backup Script:**
```bash
#!/bin/bash

# Configuration
BACKUP_DIR="/var/www/freelancer-website/backend/backups"
DB_PATH="/var/www/freelancer-website/backend/database/production.sqlite3"
RETENTION_DAYS=30
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
BACKUP_FILE="$BACKUP_DIR/backup-$TIMESTAMP.sqlite3"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Create backup
echo "Starting backup at $(date)"
cp "$DB_PATH" "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "Backup created successfully: $BACKUP_FILE"
    
    # Compress backup
    gzip "$BACKUP_FILE"
    echo "Backup compressed: ${BACKUP_FILE}.gz"
    
    # Remove old backups
    find "$BACKUP_DIR" -name "backup-*.sqlite3.gz" -mtime +$RETENTION_DAYS -delete
    echo "Old backups removed (older than $RETENTION_DAYS days)"
else
    echo "Backup failed!"
    exit 1
fi

echo "Backup completed at $(date)"
```

#### 8.2 Make Script Executable
```bash
chmod +x scripts/backup.sh
```

#### 8.3 Setup Cron Job
```bash
crontab -e
```

Add this line for daily backups at 2 AM:
```
0 2 * * * /var/www/freelancer-website/backend/scripts/backup.sh >> /var/log/freelancer-backup.log 2>&1
```

---

### Step 9: Monitoring and Logging

#### 9.1 Setup Log Rotation
```bash
sudo nano /etc/logrotate.d/freelancer-website
```

**Log Rotation Config:**
```
/var/log/nginx/freelancer-website.*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data adm
    sharedscripts
    postrotate
        [ -f /var/run/nginx.pid ] && kill -USR1 `cat /var/run/nginx.pid`
    endscript
}

/var/log/freelancer-backup.log {
    weekly
    missingok
    rotate 4
    compress
    delaycompress
    notifempty
}
```

#### 9.2 Monitor Backend
```bash
# View logs
pm2 logs freelancer-backend

# Monitor resources
pm2 monit

# Restart if needed
pm2 restart freelancer-backend
```

---

### Step 10: Security Hardening

#### 10.1 Secure Database File
```bash
cd /var/www/freelancer-website/backend
chmod 600 database/production.sqlite3
chown $USER:$USER database/production.sqlite3
```

#### 10.2 Secure Environment File
```bash
chmod 600 .env
```

#### 10.3 Disable Directory Listing
Already handled in Nginx config.

#### 10.4 Rate Limiting
Already configured in Express (100 requests per 15 minutes per IP).

#### 10.5 Regular Updates
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Node.js packages
cd /var/www/freelancer-website/backend
npm update

# Restart backend
pm2 restart freelancer-backend
```

---

## 🧪 Testing Deployment

### Test 1: Health Check
```bash
curl https://yourdomain.com/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 12345.67
}
```

### Test 2: Frontend
1. Open https://yourdomain.com
2. Verify pages load correctly
3. Check console for errors

### Test 3: Authentication
1. Login as admin: `admin@yourdomain.com` / your-password
2. Verify admin dashboard loads
3. Logout
4. Login as client: `client@demo.com` / `client123`
5. Verify client portal loads

### Test 4: API Endpoints
```bash
# Test login
curl -X POST https://yourdomain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@yourdomain.com","password":"your-password"}'

# Test projects (with token)
curl https://yourdomain.com/api/projects \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Test 5: Database Persistence
1. Create a project via admin panel
2. Refresh the page
3. ✅ Project should still be there
4. Login from different browser/device
5. ✅ Project should be visible

---

## 🔄 Update Deployment

### Update Frontend
```bash
cd /var/www/freelancer-website
# Pull latest code
git pull origin main

# Rebuild frontend
npm run build

# Copy to frontend directory
sudo cp -r dist/* frontend/
sudo chown -R www-data:www-data frontend

# Nginx will automatically serve new files
```

### Update Backend
```bash
cd /var/www/freelancer-website/backend
# Pull latest code
git pull origin main

# Install new dependencies
npm install --production

# Run migrations if needed
npm run db:migrate

# Restart backend
pm2 restart freelancer-backend
```

---

## 📊 Monitoring

### PM2 Monitoring
```bash
# View status
pm2 status

# View logs
pm2 logs

# Monitor resources
pm2 monit
```

### Nginx Logs
```bash
# Access log
sudo tail -f /var/log/nginx/freelancer-website.access.log

# Error log
sudo tail -f /var/log/nginx/freelancer-website.error.log
```

### Database Size
```bash
ls -lh /var/www/freelancer-website/backend/database/production.sqlite3
```

### Backup Verification
```bash
ls -lh /var/www/freelancer-website/backend/backups/
```

---

## 🚨 Troubleshooting

### Issue: Backend won't start
```bash
# Check logs
pm2 logs freelancer-backend --lines 100

# Check if port is in use
sudo lsof -i :3001

# Restart
pm2 restart freelancer-backend
```

### Issue: Database locked
```bash
# Check for zombie processes
pm2 status

# Restart backend
pm2 restart freelancer-backend

# If still locked, backup and restore
cp database/production.sqlite3 database/production.sqlite3.backup
# Restart backend
pm2 restart freelancer-backend
```

### Issue: 502 Bad Gateway
```bash
# Check if backend is running
pm2 status

# Check Nginx error log
sudo tail -f /var/log/nginx/freelancer-website.error.log

# Restart both services
pm2 restart freelancer-backend
sudo systemctl restart nginx
```

### Issue: SSL Certificate Expired
```bash
# Renew certificate
sudo certbot renew

# Reload Nginx
sudo systemctl reload nginx
```

---

## 📈 Performance Optimization

### Enable Gzip Compression
Add to Nginx config:
```nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
gzip_min_length 1000;
```

### Enable Browser Caching
Add to Nginx config:
```nginx
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    expires 30d;
    add_header Cache-Control "public, immutable";
}
```

### Optimize SQLite
Already configured in `database/init.js`:
- WAL mode enabled
- Synchronous = NORMAL
- Cache size = 64MB
- Foreign keys enabled

---

## 🔐 Security Checklist

- [ ] Strong JWT secret (64+ characters)
- [ ] Strong admin password (12+ characters)
- [ ] HTTPS enabled (SSL certificate)
- [ ] Firewall configured (UFW)
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS protection (Helmet.js)
- [ ] CORS properly configured
- [ ] Database file permissions (600)
- [ ] Environment file permissions (600)
- [ ] Regular backups configured
- [ ] Log rotation configured
- [ ] System updates scheduled

---

## 📞 Support

### Logs Location
- **Nginx Access**: `/var/log/nginx/freelancer-website.access.log`
- **Nginx Error**: `/var/log/nginx/freelancer-website.error.log`
- **Backend**: `pm2 logs freelancer-backend`
- **Backup**: `/var/log/freelancer-backup.log`

### Useful Commands
```bash
# View backend status
pm2 status

# View backend logs
pm2 logs freelancer-backend

# Restart backend
pm2 restart freelancer-backend

# View Nginx status
sudo systemctl status nginx

# Restart Nginx
sudo systemctl restart nginx

# Check SSL certificate
sudo certbot certificates

# Renew SSL certificate
sudo certbot renew

# View database size
ls -lh /var/www/freelancer-website/backend/database/production.sqlite3

# Manual backup
cd /var/www/freelancer-website/backend && ./scripts/backup.sh
```

---

## ✅ Deployment Complete!

Your production deployment is now complete with:
- ✅ Server-side SQLite3 database
- ✅ Secure JWT authentication
- ✅ HTTPS encryption
- ✅ Automated backups
- ✅ Process management (PM2)
- ✅ Reverse proxy (Nginx)
- ✅ Rate limiting
- ✅ Security hardening
- ✅ Monitoring and logging

**Your application is now production-ready!** 🎉

---

## 📚 Additional Resources

- [PM2 Documentation](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Let's Encrypt](https://letsencrypt.org/)
- [SQLite Documentation](https://www.sqlite.org/docs.html)
- [Express.js Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)

---

**Last Updated:** 2024  
**Version:** 1.0.0  
**Status:** ✅ Production Ready
