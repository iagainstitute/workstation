# 📋 Pre-Deployment Checklist

Use this checklist before deploying to Hostinger to ensure everything is configured correctly.

## ✅ Code & Files

- [ ] All changes committed to Git
- [ ] `.env.production` file created with correct values
- [ ] `deploy-hostinger.sh` script is executable
- [ ] No sensitive data (passwords, keys) in code
- [ ] All dependencies listed in `package.json`

## ✅ Environment Variables

Create `.env` file on server with:

- [ ] `DATABASE_URL` - Set to SQLite path (default is fine)
- [ ] `NEXTAUTH_SECRET` - Generated random secret (use `openssl rand -base64 32`)
- [ ] `NEXTAUTH_URL` - Your production domain URL
- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key

### Optional but Recommended:
- [ ] `SMTP_HOST` - Email server hostname
- [ ] `SMTP_PORT` - Email server port (usually 587)
- [ ] `SMTP_USER` - Email username
- [ ] `SMTP_PASSWORD` - Email password
- [ ] `EMAIL_FROM` - From email address

### Optional - Calendar Integration:
- [ ] `GOOGLE_CLIENT_ID` - Google OAuth client ID
- [ ] `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- [ ] `MICROSOFT_CLIENT_ID` - Microsoft OAuth client ID
- [ ] `MICROSOFT_CLIENT_SECRET` - Microsoft OAuth client secret

## ✅ Server Requirements

- [ ] Node.js 18 or higher installed
- [ ] npm installed
- [ ] Git installed (if deploying via Git)
- [ ] PM2 installed globally (`npm install -g pm2`)
- [ ] Nginx installed (for reverse proxy)
- [ ] SSL certificate ready (Let's Encrypt)

Check versions:
```bash
node --version  # Should be v18.0.0 or higher
npm --version   # Should be v8.0.0 or higher
```

## ✅ Server Setup

- [ ] SSH access configured
- [ ] Project uploaded to `/var/www/workstation`
- [ ] Directory permissions set correctly
- [ ] Data directory created: `/var/www/workstation/data`
- [ ] Firewall allows ports 80 and 443

## ✅ Domain & DNS

- [ ] Domain name registered
- [ ] DNS A record points to server IP
- [ ] Domain propagated (check with `nslookup yourdomain.com`)

## ✅ Nginx Configuration

- [ ] Nginx config file created in `/etc/nginx/sites-available/`
- [ ] Symlink created in `/etc/nginx/sites-enabled/`
- [ ] Nginx configuration tested (`sudo nginx -t`)
- [ ] Nginx restarted (`sudo systemctl restart nginx`)

## ✅ Database

- [ ] Prisma schema is SQLite-compatible (no `@db.Text`, no `Int[]`)
- [ ] Database directory exists and is writable
- [ ] Prisma Client generated successfully

## ✅ Security

- [ ] `NEXTAUTH_SECRET` is strong and random
- [ ] `.env` file is not committed to Git
- [ ] Firewall configured (only ports 80, 443, 22 open)
- [ ] SSH uses key authentication (no password)
- [ ] SSL certificate installed

## ✅ Testing

Before going live:

- [ ] Test local build: `npm run build && npm start`
- [ ] Check all pages load correctly
- [ ] Test student login functionality
- [ ] Test booking creation
- [ ] Test email notifications (if configured)
- [ ] Check mobile responsiveness

## ✅ Post-Deployment

After deployment:

- [ ] Application accessible at domain URL
- [ ] HTTPS working (SSL certificate)
- [ ] PM2 running and monitoring
- [ ] Logs showing no errors (`pm2 logs workstation`)
- [ ] Database created and accessible
- [ ] All features working as expected

## Quick Commands Reference

```bash
# Generate secret
openssl rand -base64 32

# Check Node version
node --version

# Install PM2
npm install -g pm2

# Run deployment script
chmod +x deploy-hostinger.sh
./deploy-hostinger.sh

# Check PM2 status
pm2 status

# View logs
pm2 logs workstation

# Restart app
pm2 restart workstation

# Test Nginx config
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

# Install SSL
sudo certbot --nginx -d yourdomain.com
```

## Common Issues & Solutions

### Issue: "Prisma schema validation error"
✅ **Solution:** Schema is now fixed! All `@db.Text` and `Int[]` removed.

### Issue: "Port 3000 already in use"
✅ **Solution:**
```bash
sudo lsof -i :3000
kill -9 [PID]
```

### Issue: "Permission denied"
✅ **Solution:**
```bash
sudo chown -R $USER:$USER /var/www/workstation
chmod -R 755 /var/www/workstation
```

### Issue: "Database is locked"
✅ **Solution:**
```bash
pm2 stop workstation
rm -f ./data/*.db-wal
rm -f ./data/*.db-shm
pm2 start workstation
```

---

## Ready to Deploy? 🚀

If all checkboxes are ticked, you're ready to run:

```bash
cd /var/www/workstation
./deploy-hostinger.sh
```

Good luck! 🎉
