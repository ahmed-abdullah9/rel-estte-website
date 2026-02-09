const AuthService = require('../services/auth.service');
const { successResponse, errorResponse } = require('../utils/response');
const { validateEmail, validatePassword } = require('../validators/auth.validator');
const logger = require('../utils/logger');

class AuthController {
  static async register(req, res, next) {
    try {
      const { email, password } = req.body;
      
      // Validate input
      if (!validateEmail(email)) {
        return errorResponse(res, { email: 'Invalid email format' }, 'Validation failed', 400);
      }
      
      if (!validatePassword(password)) {
        return errorResponse(res, { 
          password: 'Password must be at least 8 characters with uppercase, lowercase, and number' 
        }, 'Validation failed', 400);
      }
      
      const result = await AuthService.register(email, password);
      
      logger.info('User registered successfully:', { email });
      
      return successResponse(res, result, 'Registration successful', 201);
    } catch (error) {
      logger.error('Registration error:', error);
      
      if (error.message === 'User already exists') {
        return errorResponse(res, { email: 'Email already registered' }, 'Registration failed', 409);
      }
      
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
        return errorResponse(res, null, 'Invalid email or password', 401);
      }
      
      logger.info('User logged in successfully:', { email });
      
      return successResponse(res, result, 'Login successful');
    } catch (error) {
      logger.error('Login error:', error);
      next(error);
    }
  }

  static async getProfile(req, res, next) {
    try {
      const userId = req.user.id;
      const profile = await AuthService.getProfile(userId);
      
      return successResponse(res, profile, 'Profile retrieved successfully');
    } catch (error) {
      logger.error('Get profile error:', error);
      next(error);
    }
  }

  static async refreshToken(req, res, next) {
    try {
      const user = req.user;
      const token = AuthService.generateToken(user.id, user.email, user.role);
      
      return successResponse(res, { token }, 'Token refreshed successfully');
    } catch (error) {
      logger.error('Refresh token error:', error);
      next(error);
    }
  }
}

module.exports = AuthController;