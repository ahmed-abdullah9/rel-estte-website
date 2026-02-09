const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const path = require('path');

const authRoutes = require('./routes/auth.routes');
const urlRoutes = require('./routes/url.routes');
const adminRoutes = require('./routes/admin.routes');
const redirectRoutes = require('./routes/redirect.routes');

const errorMiddleware = require('./middleware/error.middleware');
const logger = require('./utils/logger');
const database = require('./config/database');

const app = express();

// Trust proxy for rate limiting
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com", "cdnjs.cloudflare.com"],
      fontSrc: ["'self'", "fonts.gstatic.com", "cdnjs.cloudflare.com"],
      scriptSrc: ["'self'", "cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "https:"]
    }
  }
}));

// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));

// Compression
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { success: false, message: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

const shortenLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 shortens per windowMs
  message: { success: false, message: 'Too many URL shortening requests, please try again later' }
});

app.use(limiter);
app.use('/api/urls/shorten', shortenLimiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
app.use(morgan('combined', { 
  stream: { write: message => logger.info(message.trim()) }
}));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Diagnostic endpoint
app.get('/api/diagnostic', async (req, res) => {
  const diagnostic = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: {},
    tables: {},
    error_logs: [],
    system: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.version
    }
  };

  try {
    // Test database connection
    const connection = await database.getConnection();
    diagnostic.database.status = 'connected';
    
    // Get table structure
    try {
      const [tableRows] = await connection.execute('DESCRIBE urls');
      diagnostic.tables.urls = tableRows;
    } catch (tableError) {
      diagnostic.tables.urls_error = tableError.message;
    }

    // Check if urls table has data
    try {
      const [countResult] = await connection.execute('SELECT COUNT(*) as count FROM urls');
      diagnostic.tables.urls_count = countResult[0].count;
    } catch (countError) {
      diagnostic.tables.urls_count_error = countError.message;
    }

    connection.release();
  } catch (dbError) {
    diagnostic.database.status = 'error';
    diagnostic.database.error = {
      message: dbError.message,
      code: dbError.code,
      errno: dbError.errno
    };
  }

  // Get error logs
  try {
    const errorLogPath = path.join(__dirname, 'logs', 'error.log');
    if (fs.existsSync(errorLogPath)) {
      const errorLog = fs.readFileSync(errorLogPath, 'utf8');
      const lines = errorLog.split('\n').filter(line => line.trim());
      diagnostic.error_logs = lines.slice(-20); // Last 20 lines
    } else {
      diagnostic.error_logs = ['No error log file found'];
    }
  } catch (logError) {
    diagnostic.error_logs = [`Error reading logs: ${logError.message}`];
  }

  // Get app log
  try {
    const appLogPath = path.join(__dirname, 'logs', 'app.log');
    if (fs.existsSync(appLogPath)) {
      const appLog = fs.readFileSync(appLogPath, 'utf8');
      const lines = appLog.split('\n').filter(line => line.trim());
      diagnostic.app_logs = lines.slice(-10); // Last 10 lines
    }
  } catch (logError) {
    diagnostic.app_logs = [`Error reading app logs: ${logError.message}`];
  }

  res.json(diagnostic);
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/urls', urlRoutes);
app.use('/api/admin', adminRoutes);
app.use('/', redirectRoutes); // Handle short URL redirects

// Static files
app.use(express.static('public'));

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'API endpoint not found',
    path: req.path
  });
});

// Error handler (must be last)
app.use(errorMiddleware);

module.exports = app;