#!/bin/bash
set -e

PROJECT_NAME="rel-estte-website"
DB_NAME="linkshort_db"
DB_USER="linkshort_user"
DB_PASS="LinkShort123!"
MYSQL_ROOT_PASS="MyPass123!@#"

echo "🚀 Setting up $PROJECT_NAME LinkShort..."

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
mysql -u root -p$MYSQL_ROOT_PASS < schema.sql

# Backend setup
echo "📦 Installing backend dependencies..."
cd backend
npm install --production

# Environment setup
echo "⚙️ Setting up environment..."
if [ ! -f .env ]; then
  echo "NODE_ENV=production
PORT=3000
DB_HOST=localhost
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASS
DB_NAME=$DB_NAME
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-linkshort-$(date +%s)
JWT_EXPIRES_IN=7d
BASE_URL=http://143.110.253.11
ALLOWED_ORIGINS=http://143.110.253.11,http://localhost" > .env
fi

# Create logs directory
mkdir -p logs

# PM2 setup
echo "🔄 Starting backend with PM2..."
pm2 delete rel-estte-backend 2>/dev/null || true
pm2 start server.js --name rel-estte-backend
pm2 save

echo "✅ Setup complete!"
echo "🌐 Backend: http://143.110.253.11:3000"
echo "📊 Health Check: http://143.110.253.11:3000/health"
echo "🔗 API: http://143.110.253.11:3000/api/"
echo "👤 Admin: admin@linkshort.com / Admin123!"