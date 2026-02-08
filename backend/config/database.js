const mysql = require('mysql2');
const config = require('./constants');
const logger = require('../utils/logger');

// Create connection pool with correct options
const pool = mysql.createPool({
  host: config.DB_HOST,
  user: config.DB_USER,
  password: config.DB_PASSWORD,
  database: config.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true,
  charset: 'utf8mb4'
});

// Test connection
pool.getConnection((err, connection) => {
  if (err) {
    logger.error('❌ Database connection failed:', err.message);
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