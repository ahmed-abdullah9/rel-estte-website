#!/bin/bash
set -e

PROJECT_NAME="rel-estte-website"
DB_NAME="linkshort_db"
DB_USER="linkshort_user"
DB_PASS="LinkShort123!"
MYSQL_ROOT_PASS="MyPass123!@#"

echo "🚀 Setting up LinkShort URL Shortener..."

# Database setup
echo "📊 Creating database and user..."
mysql -u root -p$MYSQL_ROOT_PASS <<EOF
CREATE DATABASE IF NOT EXISTS $DB_NAME;
CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASS';
GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'localhost';
FLUSH PRIVILEGES;
EOF

# Import schema
echo "📋 Importing database schema..."
mysql -u $DB_USER -p$DB_PASS $DB_NAME < schema.sql

# Backend setup
echo "📦 Installing backend dependencies..."
cd backend
npm install --production

# Create logs directory
mkdir -p logs

# Start backend
echo "🔄 Starting backend server..."
pm2 delete $PROJECT_NAME 2>/dev/null || true
pm2 start server.js --name $PROJECT_NAME
pm2 save

echo "✅ Setup complete!"
echo "🌐 Frontend: http://143.110.253.11/$PROJECT_NAME/"
echo "🔗 API: http://143.110.253.11/api/"
echo "👨‍💼 Admin: admin@linkshort.com / Admin123!"