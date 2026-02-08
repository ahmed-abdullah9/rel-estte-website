const AuthService = require('../services/auth.service');
const { successResponse, errorResponse } = require('../utils/response');
const { validateEmail, validatePassword } = require('../validators/auth.validator');
const logger = require('../utils/logger');

class AuthController {
  static async register(req, res, next) {
    try {
      const { email, password } = req.body;
      
      // Validate input
      if (!email || !password) {
        return errorResponse(res, null, 'Email and password are required', 400);
      }
      
      if (!validateEmail(email)) {
        return errorResponse(res, null, 'Invalid email format', 400);
      }
      
      if (!validatePassword(password)) {
        return errorResponse(res, null, 'Password must be at least 8 characters with uppercase, lowercase and number', 400);
      }
      
      const result = await AuthService.register(email, password);
      
      logger.info('User registered:', { email, userId: result.user.id });
      
      return successResponse(res, result, 'Registration successful', 201);
    } catch (error) {
      if (error.message === 'User already exists') {
        return errorResponse(res, null, error.message, 409);
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
      
      logger.info('User logged in:', { email, userId: result.user.id });
      
      return successResponse(res, result, 'Login successful');
    } catch (error) {
      next(error);
    }
  }

  static async getProfile(req, res, next) {
    try {
      const userId = req.user.id;
      
      const profile = await AuthService.getProfile(userId);
      
      return successResponse(res, profile);
    } catch (error) {
      next(error);
    }
  }

  static async refreshToken(req, res, next) {
    try {
      const userId = req.user.id;
      const user = req.user;
      
      const token = AuthService.generateToken(user.id, user.email, user.role);
      
      return successResponse(res, { token }, 'Token refreshed');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AuthController;