const mysql = require('mysql2/promise');
const config = require('./constants');
const logger = require('../utils/logger');

class Database {
  constructor() {
    this.pool = null;
    this.init();
  }

  init() {
    try {
      this.pool = mysql.createPool({
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

      logger.info('✅ Database pool created successfully');
    } catch (error) {
      logger.error('❌ Database pool creation failed:', error);
      throw error;
    }
  }

  async execute(query, params = []) {
    try {
      logger.debug('Executing query:', { query, params });
      const [results] = await this.pool.execute(query, params);
      return results;
    } catch (error) {
      logger.error('❌ Database query error:', {
        query,
        params,
        error: error.message,
        code: error.code,
        errno: error.errno,
        sqlState: error.sqlState,
        sqlMessage: error.sqlMessage
      });
      throw error;
    }
  }

  async query(sql, params = []) {
    try {
      logger.debug('Executing query:', { sql, params });
      const [results] = await this.pool.query(sql, params);
      return results;
    } catch (error) {
      logger.error('❌ Database query error:', {
        sql,
        params,
        error: error.message,
        code: error.code,
        errno: error.errno,
        sqlState: error.sqlState,
        sqlMessage: error.sqlMessage
      });
      throw error;
    }
  }

  async close() {
    if (this.pool) {
      await this.pool.end();
      logger.info('Database pool closed');
    }
  }
}

const database = new Database();
module.exports = database;