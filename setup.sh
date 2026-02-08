#!/bin/bash

echo "🚀 Setting up LinkShort URL Shortener..."

# Check if MySQL is running
if ! command -v mysql &> /dev/null; then
    echo "❌ MySQL is not installed. Please install MySQL first."
    exit 1
fi

# Get MySQL root password
read -sp "Enter MySQL root password: " MYSQL_ROOT_PASSWORD
echo ""

# Create database and user
echo "📊 Creating database and user..."
mysql -u root -p$MYSQL_ROOT_PASSWORD <<EOF
CREATE DATABASE IF NOT EXISTS linkshort_db;
CREATE USER IF NOT EXISTS 'linkshort_user'@'localhost' IDENTIFIED BY 'SecurePass123';
GRANT ALL PRIVILEGES ON linkshort_db.* TO 'linkshort_user'@'localhost';
FLUSH PRIVILEGES;
EOF

if [ $? -ne 0 ]; then
    echo "❌ Failed to create database. Please check your MySQL root password."
    exit 1
fi

# Import schema
echo "📋 Importing database schema..."
mysql -u linkshort_user -pSecurePass123 linkshort_db < schema.sql

if [ $? -ne 0 ]; then
    echo "❌ Failed to import schema."
    exit 1
fi

# Install Node.js dependencies
echo "📦 Installing Node.js dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies. Make sure Node.js is installed."
    exit 1
fi

# Create admin user
echo "👤 Creating admin user..."
npm run setup

# Install PM2 if not already installed
if ! command -v pm2 &> /dev/null; then
    echo "🔄 Installing PM2..."
    npm install -g pm2
fi

# Start the application
echo "🚀 Starting LinkShort server..."
pm2 delete linkshort 2>/dev/null || true
pm2 start server.js --name linkshort
pm2 save
pm2 startup

echo ""
echo "✅ LinkShort setup completed successfully!"
echo ""
echo "🌐 Application URL: http://localhost:3000"
echo "👨‍💼 Admin Panel: http://localhost:3000/admin-login.html"
echo "📧 Admin Email: admin@linkshort.com"
echo "🔐 Admin Password: Admin123!"
echo ""
echo "📊 Database Details:"
echo "   - Database: linkshort_db"
echo "   - User: linkshort_user"
echo "   - Password: SecurePass123"
echo ""
echo "🔍 Check status: pm2 status"
echo "📝 View logs: pm2 logs linkshort"
echo "🛑 Stop server: pm2 stop linkshort"
echo ""