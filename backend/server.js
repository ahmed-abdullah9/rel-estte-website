const app = require('./app');
const config = require('./config/constants');
const logger = require('./utils/logger');
const database = require('./config/database');

const PORT = config.PORT || 3000;

// Test database connection
database.execute('SELECT 1')
  .then(() => {
    logger.info('✅ Database connected successfully');
  })
  .catch((error) => {
    logger.error('❌ Database connection failed:', error.message);
    process.exit(1);
  });

const server = app.listen(PORT, () => {
  logger.info('🚀 LinkShort Server Started Successfully!');
  logger.info('==========================================');
  logger.info(`📱 Application: http://localhost:${PORT}`);
  logger.info(`👨‍💼 Admin Panel: http://localhost:${PORT}/admin-login.html`);
  logger.info('');
  logger.info('👤 Admin Credentials:');
  logger.info('   📧 Email: admin@linkshort.com');
  logger.info('   🔐 Password: Admin123!');
  logger.info('');
  logger.info('📊 Database: Connected ✅');
  logger.info(`🔧 Environment: ${config.NODE_ENV}`);
  logger.info('==========================================');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, closing server...');
  server.close(() => {
    database.close();
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, closing server...');
  server.close(() => {
    database.close();
    process.exit(0);
  });
});

process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Rejection:', err);
  process.exit(1);
});

module.exports = server;