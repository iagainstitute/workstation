# 🚀 Quick Deployment Guide for Hostinger

## TL;DR - Quick Commands

```bash
# 1. Upload project to server at /var/www/workstation

# 2. SSH into your Hostinger server
ssh root@your-server-ip

# 3. Navigate to project
cd /var/www/workstation

# 4. Copy and edit environment file
cp .env.production .env
nano .env
# Update NEXTAUTH_SECRET, NEXTAUTH_URL, and SMTP settings

# 5. Run deployment script
chmod +x deploy-hostinger.sh
./deploy-hostinger.sh

# Done! ✅
```

## What the Script Does

1. ✅ Cleans npm cache
2. ✅ Installs dependencies with `--legacy-peer-deps`
3. ✅ Generates Prisma Client
4. ✅ Creates SQLite database
5. ✅ Builds Next.js for production
6. ✅ Starts with PM2 (if available)

## Important Configuration

### 1. Environment Variables (.env)

**Required:**
- `DATABASE_URL` - Already set for SQLite
- `NEXTAUTH_SECRET` - Generate with: `openssl rand -base64 32`
- `NEXTAUTH_URL` - Your domain (e.g., `https://yourdomain.com`)

**Optional:**
- `SMTP_*` - For sending emails
- `GOOGLE_*` - For Google Calendar
- `MICROSOFT_*` - For Microsoft Calendar

### 2. Generate Secret

```bash
openssl rand -base64 32
```

Copy the output and paste it in your `.env` file as `NEXTAUTH_SECRET`

### 3. Install PM2 (Recommended)

```bash
npm install -g pm2
```

PM2 will:
- Keep your app running
- Auto-restart on crashes
- Start on server reboot

## After Deployment

### View Application
Your app runs on port 3000 by default:
```bash
http://your-server-ip:3000
```

### Check Logs
```bash
pm2 logs workstation
```

### Restart Application
```bash
pm2 restart workstation
```

### Stop Application
```bash
pm2 stop workstation
```

## Setup Domain with Nginx

### 1. Install Nginx (if not installed)
```bash
sudo apt update
sudo apt install nginx
```

### 2. Create Site Configuration
```bash
sudo nano /etc/nginx/sites-available/workstation
```

Paste this:
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 3. Enable Site
```bash
sudo ln -s /etc/nginx/sites-available/workstation /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 4. Setup SSL (Free with Let's Encrypt)
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

## Troubleshooting

### Problem: npm install fails
**Solution:**
```bash
npm cache clean --force
npm install --legacy-peer-deps --force
```

### Problem: Prisma generate fails
**Solution:**
```bash
npx prisma validate
npx prisma generate --schema=./prisma/schema.prisma
```

### Problem: Port 3000 already in use
**Solution:**
```bash
# Find process using port 3000
sudo lsof -i :3000

# Kill the process (replace PID with actual process ID)
kill -9 PID

# Or change port in package.json start script:
# "start": "next start -p 3001"
```

### Problem: Database locked
**Solution:**
```bash
pm2 stop workstation
rm -f ./data/production.db-wal
rm -f ./data/production.db-shm
pm2 start workstation
```

## File Permissions

Make sure the app can write to the database:
```bash
chown -R www-data:www-data /var/www/workstation
chmod -R 755 /var/www/workstation
chmod -R 775 /var/www/workstation/data
```

## Firewall Configuration

Allow HTTP and HTTPS:
```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

## Need More Help?

See the full deployment guide: `DEPLOYMENT.md`
