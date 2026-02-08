const database = require('../config/database');

class URLModel {
  static async create(urlData) {
    const query = `
      INSERT INTO urls (original_url, short_code, user_id, title, created_at)
      VALUES (?, ?, ?, ?, NOW())
    `;
    
    const params = [
      urlData.original_url,
      urlData.short_code,
      urlData.user_id || null,
      urlData.title || null
    ];
    
    const result = await database.execute(query, params);
    return { id: result.insertId, ...urlData };
  }

  static async findByShortCode(shortCode) {
    const query = 'SELECT * FROM urls WHERE short_code = ? AND is_active = 1';
    const results = await database.execute(query, [shortCode]);
    return results[0] || null;
  }

  static async findById(id) {
    const query = 'SELECT * FROM urls WHERE id = ?';
    const results = await database.execute(query, [id]);
    return results[0] || null;
  }

  static async findByUserId(userId, limit = 50, offset = 0) {
    const query = `
      SELECT * FROM urls 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `;
    return await database.execute(query, [userId, limit, offset]);
  }

  static async updateClickCount(shortCode) {
    const query = `
      UPDATE urls 
      SET click_count = click_count + 1, last_accessed = NOW() 
      WHERE short_code = ?
    `;
    return await database.execute(query, [shortCode]);
  }

  static async getStats() {
    const query = `
      SELECT 
        COUNT(*) as total_urls,
        COALESCE(SUM(click_count), 0) as total_clicks,
        COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 1 END) as urls_today,
        COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as urls_week
      FROM urls
    `;
    const results = await database.execute(query);
    return results[0];
  }

  static async getTopUrls(limit = 10) {
    const query = `
      SELECT short_code, original_url, click_count, created_at
      FROM urls 
      WHERE is_active = 1 
      ORDER BY click_count DESC 
      LIMIT ?
    `;
    return await database.execute(query, [limit]);
  }

  static async deleteById(id) {
    const query = 'UPDATE urls SET is_active = 0 WHERE id = ?';
    return await database.execute(query, [id]);
  }

  static async shortCodeExists(shortCode) {
    const query = 'SELECT id FROM urls WHERE short_code = ?';
    const results = await database.execute(query, [shortCode]);
    return results.length > 0;
  }

  static async getAllWithPagination(limit = 50, offset = 0, search = '') {
    let query = `
      SELECT u.*, us.email as user_email
      FROM urls u
      LEFT JOIN users us ON u.user_id = us.id
    `;
    
    let params = [];
    
    if (search) {
      query += ' WHERE u.original_url LIKE ? OR u.short_code LIKE ?';
      params.push(`%${search}%`, `%${search}%`);
    }
    
    query += ' ORDER BY u.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    return await database.execute(query, params);
  }
}

module.exports = URLModel;