const database = require('../config/database');
const bcrypt = require('bcryptjs');

class UserModel {
  static async create(userData) {
    const hashedPassword = await bcrypt.hash(userData.password, 12);
    
    const query = `
      INSERT INTO users (email, password, role, created_at)
      VALUES (?, ?, ?, NOW())
    `;
    
    const params = [
      userData.email,
      hashedPassword,
      userData.role || 'user'
    ];
    
    const result = await database.execute(query, params);
    return { 
      id: result.insertId, 
      email: userData.email, 
      role: userData.role || 'user'
    };
  }

  static async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = ?';
    const results = await database.execute(query, [email]);
    return results[0] || null;
  }

  static async findById(id) {
    const query = 'SELECT id, email, role, created_at FROM users WHERE id = ?';
    const results = await database.execute(query, [id]);
    return results[0] || null;
  }

  static async validatePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  static async updateLastLogin(userId) {
    const query = 'UPDATE users SET last_login = NOW() WHERE id = ?';
    return await database.execute(query, [userId]);
  }

  static async getStats() {
    const query = `
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_users,
        COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 1 END) as users_today,
        COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as users_week
      FROM users
    `;
    const results = await database.execute(query);
    return results[0];
  }

  static async getAllWithPagination(limit = 50, offset = 0) {
    const query = `
      SELECT id, email, role, created_at, last_login
      FROM users 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `;
    return await database.execute(query, [limit, offset]);
  }

  static async deleteById(id) {
    const query = 'DELETE FROM users WHERE id = ? AND role != "admin"';
    return await database.execute(query, [id]);
  }
}

module.exports = UserModel;