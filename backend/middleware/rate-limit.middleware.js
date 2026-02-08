const rateLimit = require('express-rate-limit');

const createLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: { success: false, message },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      // Skip rate limiting in development for localhost
      if (process.env.NODE_ENV === 'development') {
        const ip = req.ip || req.connection.remoteAddress;
        return ip === '127.0.0.1' || ip === '::1';
      }
      return false;
    }
  });
};

module.exports = {
  // General API rate limit
  apiLimit: createLimiter(
    15 * 60 * 1000, // 15 minutes
    100, // requests per windowMs
    'Too many requests, please try again later'
  ),

  // URL shortening rate limit
  shortenLimit: createLimiter(
    15 * 60 * 1000, // 15 minutes
    20, // requests per windowMs
    'Too many URL shortening requests, please try again later'
  ),

  // Authentication rate limit
  authLimit: createLimiter(
    15 * 60 * 1000, // 15 minutes
    10, // requests per windowMs
    'Too many authentication attempts, please try again later'
  ),

  // Admin actions rate limit
  adminLimit: createLimiter(
    5 * 60 * 1000, // 5 minutes
    50, // requests per windowMs
    'Too many admin requests, please try again later'
  )
};