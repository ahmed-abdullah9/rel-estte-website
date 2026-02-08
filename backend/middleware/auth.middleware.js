const jwt = require('jsonwebtoken');
const config = require('../config/constants');
const UserModel = require('../models/User.model');
const { errorResponse } = require('../utils/response');
const logger = require('../utils/logger');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return errorResponse(res, null, 'Access token required', 401);
    }

    const decoded = jwt.verify(token, config.JWT_SECRET);
    const user = await UserModel.findById(decoded.id);
    
    if (!user) {
      return errorResponse(res, null, 'User not found', 401);
    }

    req.user = user;
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return errorResponse(res, null, 'Invalid token', 401);
    }
    
    if (error.name === 'TokenExpiredError') {
      return errorResponse(res, null, 'Token expired', 401);
    }
    
    return errorResponse(res, null, 'Authentication failed', 401);
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return errorResponse(res, null, 'Admin access required', 403);
  }
  next();
};

// Optional authentication - doesn't fail if no token
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, config.JWT_SECRET);
      const user = await UserModel.findById(decoded.id);
      req.user = user;
    }
    
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

module.exports = {
  authenticateToken,
  requireAdmin,
  optionalAuth
};