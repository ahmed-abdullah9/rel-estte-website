#!/bin/bash
set -e

echo "🚀 Starting LinkShort Backend..."

# Navigate to backend directory
cd /var/www/rel-estte-website/backend

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create necessary directories
mkdir -p logs

# Stop existing PM2 process
echo "🛑 Stopping existing processes..."
pm2 delete linkshort 2>/dev/null || true

# Start with PM2
echo "▶️ Starting backend with PM2..."
pm2 start server.js --name linkshort

# Save PM2 configuration
pm2 save

echo "✅ Backend started successfully!"
echo "🌐 API available at: http://localhost:3000/api/"

# Test the API
echo "🧪 Testing API..."
sleep 3
curl -X POST http://localhost:3000/api/urls/shorten \
  -H "Content-Type: application/json" \
  -d '{"url":"https://google.com"}' \
  && echo "" && echo "✅ API test successful!" \
  || echo "❌ API test failed"