require('dotenv').config();

module.exports = {
  // Server Config
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Database Config
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_USER: process.env.DB_USER || 'linkshort_user',
  DB_PASSWORD: process.env.DB_PASSWORD || 'SecurePass123!',
  DB_NAME: process.env.DB_NAME || 'linkshort_db',
  
  // JWT Config
  JWT_SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  
  // URL Config
  BASE_URL: process.env.BASE_URL || 'http://localhost:3000',
  SHORT_CODE_LENGTH: 6,
  
  // Security
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  ALLOWED_PROTOCOLS: ['http:', 'https:'],
  BLOCKED_DOMAINS: ['localhost', '127.0.0.1', '0.0.0.0'],
  
  // Rate Limiting
  RATE_LIMIT_WINDOW: 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_MAX: 100, // requests per window
  SHORTEN_LIMIT_MAX: 20 // shortens per window
};