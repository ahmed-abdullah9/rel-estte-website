const AuthService = require('../services/auth.service');
const { validateEmail, validatePassword } = require('../validators/auth.validator');
const { successResponse, errorResponse } = require('../utils/response');
const logger = require('../utils/logger');

class AuthController {
  static async register(req, res, next) {
    try {
      const { email, password } = req.body;
      
      // Validate input
      const errors = {};
      
      if (!email || !validateEmail(email)) {
        errors.email = 'Valid email is required';
      }
      
      if (!password || !validatePassword(password)) {
        errors.password = 'Password must be at least 8 characters with uppercase, lowercase, and number';
      }
      
      if (Object.keys(errors).length > 0) {
        return errorResponse(res, errors, 'Validation failed', 400);
      }
      
      const result = await AuthService.register(email, password);
      
      logger.info('User registered:', { email, userId: result.user.id });
      
      return successResponse(res, result, 'Registration successful', 201);
    } catch (error) {
      if (error.message === 'User already exists') {
        return errorResponse(res, null, 'User already exists', 409);
      }
      
      logger.error('Registration error:', error);
      next(error);
    }
  }

  static async login(req, res, next) {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return errorResponse(res, null, 'Email and password are required', 400);
      }
      
      const result = await AuthService.login(email, password);
      
      if (!result) {
        return errorResponse(res, null, 'Invalid credentials', 401);
      }
      
      logger.info('User logged in:', { email, userId: result.user.id });
      
      return successResponse(res, result, 'Login successful');
    } catch (error) {
      logger.error('Login error:', error);
      next(error);
    }
  }

  static async getProfile(req, res, next) {
    try {
      const profile = await AuthService.getProfile(req.user.id);
      
      return successResponse(res, profile, 'Profile retrieved successfully');
    } catch (error) {
      logger.error('Get profile error:', error);
      next(error);
    }
  }

  static async refreshToken(req, res, next) {
    try {
      const token = AuthService.generateToken(
        req.user.id,
        req.user.email,
        req.user.role
      );
      
      return successResponse(res, { token }, 'Token refreshed successfully');
    } catch (error) {
      logger.error('Refresh token error:', error);
      next(error);
    }
  }
}

module.exports = AuthController;