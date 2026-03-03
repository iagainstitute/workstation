#!/bin/bash

# Cleanup and Build Script
# This script cleans up disk space and builds the project

echo "🧹 Cleaning up disk space..."

# Remove Next.js cache and build files
echo "Removing .next directory..."
rm -rf .next

# Remove node_modules (we'll reinstall)
echo "Removing node_modules..."
rm -rf node_modules

# Clean npm cache
echo "Cleaning npm cache..."
npm cache clean --force

# Remove Prisma generated files
echo "Removing Prisma generated files..."
rm -rf node_modules/.prisma
rm -rf node_modules/@prisma

# Clear package lock
echo "Removing package-lock.json..."
rm -f package-lock.json

echo "✅ Cleanup complete!"
echo ""
echo "📦 Installing dependencies..."
npm install --legacy-peer-deps

echo ""
echo "🔧 Generating Prisma Client..."
npx prisma generate

echo ""
echo "🏗️  Building application..."
npm run build

echo ""
echo "✅ Build complete!"
