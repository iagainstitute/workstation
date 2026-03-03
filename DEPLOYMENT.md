# Hostinger Deployment Guide

## Prerequisites
- SSH access to your Hostinger VPS
- Node.js 18+ installed on server
- Git installed on server

## Step 1: Prepare the Project Locally

1. Make sure all changes are saved
2. Test that the schema is valid:
   ```bash
   npm install
   npx prisma generate
   npm run build
   ```

## Step 2: Upload to Hostinger

### Option A: Via Git (Recommended)
```bash
# On your local machine
git add .
git commit -m "Production ready"
git push origin main

# On Hostinger server
cd /var/www
git clone your-repo-url workstation
cd workstation
```

### Option B: Via FTP/SFTP
Upload the entire project folder to `/var/www/workstation`

## Step 3: Configure Environment Variables

On the Hostinger server:

```bash
cd /var/www/workstation

# Create .env file with production values
nano .env
```

Copy the contents from `.env.production` and update:
- `NEXTAUTH_SECRET` - Generate a random secret
- `NEXTAUTH_URL` - Your domain URL
- `SMTP_*` - Your email settings
- Database path if different

To generate a random secret:
```bash
openssl rand -base64 32
```

## Step 4: Install Dependencies

```bash
# Install dependencies (use legacy peer deps to avoid conflicts)
npm install --legacy-peer-deps

# Or if you prefer clean install
npm ci --legacy-peer-deps
```

## Step 5: Setup Database

```bash
# Create data directory for SQLite database
mkdir -p /var/www/workstation/data

# Generate Prisma Client
npx prisma generate

# Create database and run migrations
npx prisma db push

# Optional: Seed database with test data
npx prisma db seed
```

## Step 6: Build the Application

```bash
# Build Next.js for production
npm run build

# This will create the .next folder with optimized production build
```

## Step 7: Start the Application

### Option A: Using PM2 (Recommended for production)

```bash
# Install PM2 globally if not already installed
npm install -g pm2

# Start the application
pm2 start npm --name "workstation" -- start

# Save PM2 configuration
pm2 save

# Setup PM2 to start on server reboot
pm2 startup
```

### Option B: Using npm start directly

```bash
# Start the production server
npm start

# Or run in background
nohup npm start > output.log 2>&1 &
```

## Step 8: Configure Nginx (If using)

Create Nginx configuration:

```bash
sudo nano /etc/nginx/sites-available/workstation
```

Add this configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/workstation /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Step 9: Setup SSL (Optional but Recommended)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com
```

## Troubleshooting

### If `npm install` fails:
```bash
# Try with legacy peer deps
npm install --legacy-peer-deps --force

# Or clear cache first
npm cache clean --force
npm install --legacy-peer-deps
```

### If Prisma generation fails:
```bash
# Make sure schema is valid
npx prisma validate

# Try generating with verbose output
npx prisma generate --schema=./prisma/schema.prisma
```

### If build fails:
```bash
# Check Node.js version (should be 18+)
node --version

# Clear Next.js cache
rm -rf .next
npm run build
```

### If database is locked:
```bash
# Stop the application
pm2 stop workstation

# Remove lock file
rm -f /var/www/workstation/data/production.db-wal
rm -f /var/www/workstation/data/production.db-shm

# Restart
pm2 start workstation
```

## Useful PM2 Commands

```bash
# View logs
pm2 logs workstation

# Restart application
pm2 restart workstation

# Stop application
pm2 stop workstation

# Delete from PM2
pm2 delete workstation

# Monitor
pm2 monit

# List all processes
pm2 list
```

## Updating the Application

```bash
# Pull latest changes
cd /var/www/workstation
git pull origin main

# Install new dependencies
npm install --legacy-peer-deps

# Update database schema if changed
npx prisma generate
npx prisma db push

# Rebuild
npm run build

# Restart
pm2 restart workstation
```

## Performance Tips

1. **Enable PM2 Clustering** for better performance:
   ```bash
   pm2 start npm --name "workstation" -i max -- start
   ```

2. **Set proper Node environment**:
   ```bash
   export NODE_ENV=production
   ```

3. **Optimize SQLite**:
   - Keep database file on fast storage (SSD)
   - Consider moving to PostgreSQL for high traffic

## Quick Deploy Script

Create a file `deploy.sh`:

```bash
#!/bin/bash
cd /var/www/workstation
git pull origin main
npm install --legacy-peer-deps
npx prisma generate
npx prisma db push
npm run build
pm2 restart workstation
echo "Deployment complete!"
```

Make it executable:
```bash
chmod +x deploy.sh
```

Run it:
```bash
./deploy.sh
```
