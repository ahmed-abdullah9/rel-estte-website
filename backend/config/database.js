const mysql = require('mysql2');
const config = require('./constants');
const logger = require('../utils/logger');

// Create connection pool with ONLY valid MySQL2 options
const pool = mysql.createPool({
  host: config.DB_HOST,
  user: config.DB_USER,
  password: config.DB_PASSWORD,
  database: config.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4'
});

// Test connection on startup
pool.getConnection((err, connection) => {
  if (err) {
    logger.error('❌ Database connection failed:', err.message);
    process.exit(1);
  } else {
    logger.info('✅ Database connected successfully');
    connection.release();
  }
});

// Promisify for async/await
const promisePool = pool.promise();

module.exports = {
  execute: async (query, params = []) => {
    try {
      const [rows] = await promisePool.execute(query, params);
      return rows;
    } catch (error) {
      logger.error('Database query error:', { query, error: error.message });
      throw error;
    }
  },
  
  getConnection: () => promisePool.getConnection(),
  
  close: () => pool.end()
};