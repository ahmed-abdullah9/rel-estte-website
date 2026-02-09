const mysql = require('mysql2/promise');
const config = require('./constants');
const logger = require('../utils/logger');

// Create connection pool with ONLY valid mysql2 options
const pool = mysql.createPool({
  host: config.DB_HOST,
  user: config.DB_USER,
  password: config.DB_PASSWORD,
  database: config.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test connection
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    await connection.execute('SELECT 1');
    connection.release();
    logger.info('✅ Database connected successfully');
    return true;
  } catch (error) {
    logger.error('❌ Database connection failed:', error);
    return false;
  }
};

// Execute query wrapper with detailed logging
const execute = async (query, params = []) => {
  try {
    logger.debug('Executing query:', { query, params });
    const [results] = await pool.execute(query, params);
    return results;
  } catch (error) {
    logger.error('❌ Database query error:', {
      message: error.message,
      code: error.code,
      errno: error.errno,
      sql: error.sql,
      sqlMessage: error.sqlMessage,
      query,
      params
    });
    throw error;
  }
};

// Initialize database
const initialize = async () => {
  const isConnected = await testConnection();
  if (!isConnected) {
    throw new Error('Database connection failed');
  }
  
  logger.info('✅ Database pool created successfully');
  return pool;
};

module.exports = {
  pool,
  execute,
  testConnection,
  initialize
};