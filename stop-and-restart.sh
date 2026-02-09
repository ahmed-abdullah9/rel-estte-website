#!/bin/bash
echo "🔧 Stopping conflicting processes and restarting..."

# Stop all PM2 processes
pm2 stop all
pm2 delete all

# Kill any process on port 3000
sudo lsof -ti:3000 | xargs kill -9 2>/dev/null || true

# Wait a moment
sleep 2

echo "✅ All processes stopped"

# Start backend on different port
cd /var/www/rel-estte-website/backend
pm2 start server.js --name rel-estte-backend-new

echo "🚀 Backend restarted on new configuration"
pm2 list