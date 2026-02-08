#!/bin/bash
set -e

echo "🚀 Setting up LinkShort completely..."

# Stop any existing processes
pm2 delete rel-estte-website 2>/dev/null || true

# Install dependencies
cd /var/www/rel-estte-website/backend
npm install

# Run setup script
chmod +x ../setup.sh
bash ../setup.sh

echo "✅ Complete setup finished!"