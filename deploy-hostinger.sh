#!/bin/bash

# Hostinger Deployment Script for Workstation App
# This script automates the deployment process

set -e  # Exit on error

echo "🚀 Starting deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found. Make sure you're in the project directory.${NC}"
    exit 1
fi

echo -e "${GREEN}✓${NC} Found package.json"

# Check if .env exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠ Warning: .env file not found!${NC}"
    echo "Please create .env file with your production configuration."
    echo "You can copy .env.production as a template:"
    echo "  cp .env.production .env"
    echo ""
    read -p "Do you want to continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Create data directory if it doesn't exist
echo "📁 Creating data directory..."
mkdir -p ./data
echo -e "${GREEN}✓${NC} Data directory ready"

# Clean npm cache
echo "🧹 Cleaning npm cache..."
npm cache clean --force
echo -e "${GREEN}✓${NC} Cache cleaned"

# Install dependencies
echo "📦 Installing dependencies..."
npm install --legacy-peer-deps
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ npm install failed${NC}"
    exit 1
fi
echo -e "${GREEN}✓${NC} Dependencies installed"

# Generate Prisma Client
echo "🔧 Generating Prisma Client..."
npx prisma generate
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Prisma generate failed${NC}"
    exit 1
fi
echo -e "${GREEN}✓${NC} Prisma Client generated"

# Push database schema
echo "💾 Setting up database..."
npx prisma db push --accept-data-loss
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Database setup failed${NC}"
    exit 1
fi
echo -e "${GREEN}✓${NC} Database ready"

# Build Next.js application
echo "🏗️  Building application..."
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi
echo -e "${GREEN}✓${NC} Build complete"

# Check if PM2 is installed
if command -v pm2 &> /dev/null; then
    echo "🔄 PM2 detected, managing with PM2..."

    # Check if app is already running
    if pm2 list | grep -q "workstation"; then
        echo "♻️  Restarting workstation..."
        pm2 restart workstation
    else
        echo "▶️  Starting workstation..."
        pm2 start npm --name "workstation" -- start
        pm2 save
    fi

    echo -e "${GREEN}✓${NC} Application started with PM2"
    echo ""
    echo "📊 View logs: pm2 logs workstation"
    echo "📊 Monitor: pm2 monit"
    echo "🔄 Restart: pm2 restart workstation"
else
    echo -e "${YELLOW}⚠ PM2 not found${NC}"
    echo "Install PM2 for better process management:"
    echo "  npm install -g pm2"
    echo ""
    echo "Starting application with npm start..."
    echo "Note: This will run in foreground. Press Ctrl+C to stop."
    npm start
fi

echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo "🌐 Your application should now be running on port 3000"
echo "📝 Make sure to configure Nginx to proxy requests to localhost:3000"
echo ""
echo "Next steps:"
echo "  1. Configure your domain to point to this server"
echo "  2. Setup Nginx reverse proxy (see DEPLOYMENT.md)"
echo "  3. Install SSL certificate with certbot"
echo ""
