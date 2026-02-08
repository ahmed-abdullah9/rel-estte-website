#!/bin/bash
set -e

PROJECT_NAME="linkshort"
DB_NAME="linkshort_db"
DB_USER="linkshort_user"
DB_PASS="SecurePass123!"
MYSQL_ROOT_PASS="MyPass123!@#"

echo "🚀 Setting up LinkShort..."

# Database setup
echo "📊 Creating database..."
mysql -u root -p$MYSQL_ROOT_PASS <<EOF
CREATE DATABASE IF NOT EXISTS $DB_NAME;
CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASS';
GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'localhost';
FLUSH PRIVILEGES;
EOF

# Import schema
echo "📋 Importing schema..."
mysql -u $DB_USER -p$DB_PASS $DB_NAME < schema.sql

# Backend setup
echo "📦 Installing backend dependencies..."
cd backend
npm install

# Environment file
if [ ! -f .env ]; then
  echo "⚙️ Creating .env file..."
  cp .env.example .env
  sed -i "s/DB_NAME=.*/DB_NAME=$DB_NAME/" .env
  sed -i "s/DB_USER=.*/DB_USER=$DB_USER/" .env
  sed -i "s/DB_PASSWORD=.*/DB_PASSWORD=$DB_PASS/" .env
fi

# Create logs directory
mkdir -p logs

# PM2 setup
echo "🔄 Starting backend with PM2..."
pm2 delete $PROJECT_NAME 2>/dev/null || true
pm2 start server.js --name $PROJECT_NAME
pm2 save

echo "✅ Setup complete!"
echo "🌐 Frontend: http://localhost/rel-estte-website/"
echo "🔗 API: http://localhost:3000/api/"
echo "👨‍💼 Admin: admin@linkshort.com / Admin123!"

# Test API
echo "🧪 Testing API..."
sleep 2
curl -X POST http://localhost:3000/api/urls/shorten \
  -H "Content-Type: application/json" \
  -d '{"url":"https://google.com"}' || echo "API test failed"