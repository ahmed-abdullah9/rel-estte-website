#!/bin/bash
set -e

echo "=== LinkShort URL Shortener Setup ==="
echo ""

# Get MySQL root password
read -sp "Enter MySQL root password: " ROOTPASS
echo ""
echo ""

echo "📦 Setting up database..."

# Create database and user
mysql -u root -p$ROOTPASS <<EOF
CREATE DATABASE IF NOT EXISTS linkshort_db;
CREATE USER IF NOT EXISTS 'linkshort_user'@'localhost' IDENTIFIED BY 'LinkShort@2024';
GRANT ALL PRIVILEGES ON linkshort_db.* TO 'linkshort_user'@'localhost';
FLUSH PRIVILEGES;
EOF

# Import database schema
mysql -u linkshort_user -pLinkShort@2024 linkshort_db < schema.sql

echo "✅ Database setup completed"

# Install Node.js dependencies
echo "📦 Installing dependencies..."
npm install --production

# Create uploads directory
mkdir -p uploads

# Start application with PM2
echo "🚀 Starting application..."
npm install -g pm2 2>/dev/null || sudo npm install -g pm2

# Stop existing instance
pm2 delete linkshort 2>/dev/null || true

# Start new instance
pm2 start server.js --name linkshort
pm2 save
pm2 startup

echo ""
echo "✅ Setup completed successfully!"
echo ""
echo "🌐 Application URL: http://YOUR_SERVER_IP:3000"
echo "👤 Admin Panel: http://YOUR_SERVER_IP:3000/admin"
echo ""
echo "🔐 Admin Credentials:"
echo "   Email: admin@linkshort.com"
echo "   Password: Admin@2024"
echo ""
echo "📋 Commands:"
echo "   View logs: pm2 logs linkshort"
echo "   Restart: pm2 restart linkshort"
echo "   Stop: pm2 stop linkshort"
echo ""