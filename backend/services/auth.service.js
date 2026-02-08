const UserModel = require('../models/User.model');
const jwt = require('jsonwebtoken');
const config = require('../config/constants');

class AuthService {
  static generateToken(userId, email, role) {
    return jwt.sign(
      { id: userId, email, role },
      config.JWT_SECRET,
      { expiresIn: config.JWT_EXPIRES_IN }
    );
  }

  static async register(email, password) {
    // Check if user exists
    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      throw new Error('User already exists');
    }

    // Create user
    const user = await UserModel.create({ email, password });
    
    // Generate token
    const token = this.generateToken(user.id, user.email, user.role);

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      },
      token
    };
  }

  static async login(email, password) {
    // Find user
    const user = await UserModel.findByEmail(email);
    if (!user) {
      return null;
    }

    // Validate password
    const isValid = await UserModel.validatePassword(password, user.password);
    if (!isValid) {
      return null;
    }

    // Update last login
    await UserModel.updateLastLogin(user.id);

    // Generate token
    const token = this.generateToken(user.id, user.email, user.role);

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      },
      token
    };
  }

  static async getProfile(userId) {
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      created_at: user.created_at
    };
  }
}

module.exports = AuthService;