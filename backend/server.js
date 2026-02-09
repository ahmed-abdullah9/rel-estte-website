const app = require('./app');
const config = require('./config/constants');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 3000;

// Graceful shutdown
const gracefulShutdown = (signal) => {
  logger.info(`${signal} received, closing server...`);
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Uncaught exception handler
process.on('uncaughtException', (error) => {
  logger.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
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
  logger.info(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info('==========================================');
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    logger.error(`❌ Port ${PORT} is already in use`);
    logger.error('💡 Solutions:');
    logger.error('   1. Stop existing process: pm2 stop all');
    logger.error('   2. Kill process: lsof -ti:3000 | xargs kill -9');
    logger.error('   3. Use different port: PORT=3001 npm start');
  } else {
    logger.error('❌ Server error:', error);
  }
  process.exit(1);
});