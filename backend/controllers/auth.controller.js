const authService = require('../services/auth.service');
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
        return errorResponse(res, { password: 'Password must be at least 8 characters with uppercase, lowercase, and number' }, 'Validation failed', 400);
      }
      
      const result = await authService.register(email, password);
      
      logger.info(`User registered: ${email}`);
      
      return successResponse(res, result, 'Registration successful', 201);
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        return errorResponse(res, { email: 'Email already exists' }, 'Registration failed', 409);
      }
      
      logger.error('Registration error:', error);
      next(error);
    }
  }

  static async login(req, res, next) {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return errorResponse(res, null, 'Email and password required', 400);
      }
      
      const result = await authService.login(email, password);
      
      if (!result) {
        return errorResponse(res, null, 'Invalid credentials', 401);
      }
      
      logger.info(`User logged in: ${email}`);
      
      return successResponse(res, result, 'Login successful');
    } catch (error) {
      logger.error('Login error:', error);
      next(error);
    }
  }

  static async getProfile(req, res, next) {
    try {
      const userId = req.user.id;
      const profile = await authService.getProfile(userId);
      
      return successResponse(res, profile, 'Profile retrieved successfully');
    } catch (error) {
      logger.error('Error fetching profile:', error);
      next(error);
    }
  }

  static async refreshToken(req, res, next) {
    try {
      const userId = req.user.id;
      const newToken = await authService.generateToken(userId);
      
      return successResponse(res, { token: newToken }, 'Token refreshed successfully');
    } catch (error) {
      logger.error('Token refresh error:', error);
      next(error);
    }
  }
}

module.exports = AuthController;