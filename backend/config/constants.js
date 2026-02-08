require('dotenv').config();

module.exports = {
  // Server
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Database
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_USER: process.env.DB_USER || 'linkshort_user',
  DB_PASSWORD: process.env.DB_PASSWORD || 'LinkShort123!',
  DB_NAME: process.env.DB_NAME || 'linkshort_db',
  
  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  
  // URL Settings
  BASE_URL: process.env.BASE_URL || 'http://localhost:3000',
  SHORT_CODE_LENGTH: 6,
  
  // Security
  ALLOWED_PROTOCOLS: ['http:', 'https:'],
  BLOCKED_DOMAINS: ['localhost', '127.0.0.1', 'internal'],
  
  // Rate Limiting
  RATE_LIMIT_WINDOW: 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_MAX: 100,
  SHORTEN_RATE_LIMIT: 20
};