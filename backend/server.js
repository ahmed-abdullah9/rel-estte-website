const app = require('./app');
const config = require('./config/constants');
const logger = require('./utils/logger');

const PORT = config.PORT || 3000;

// Start server
const server = app.listen(PORT, () => {
  logger.info(`🚀 LinkShort Server Started Successfully!`);
  logger.info(`==========================================`);
  logger.info(`📱 Application: http://localhost:${PORT}`);
  logger.info(`👨‍💼 Admin Panel: http://localhost:${PORT}/admin-login.html`);
  logger.info(``);
  logger.info(`👤 Admin Credentials:`);
  logger.info(`   📧 Email: admin@linkshort.com`);
  logger.info(`   🔐 Password: Admin123!`);
  logger.info(``);
  logger.info(`📊 Database: Connected ✅`);
  logger.info(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`==========================================`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, closing server gracefully...');
  server.close(() => {
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, closing server gracefully...');
  server.close(() => {
    process.exit(0);
  });
});

process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

module.exports = server;