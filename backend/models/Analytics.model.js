const database = require('../config/database');

class AnalyticsModel {
  static async recordClick(clickData) {
    const query = `
      INSERT INTO url_analytics (
        url_id, ip_address, user_agent, browser, operating_system,
        device_type, country, referrer, clicked_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;
    
    const params = [
      clickData.url_id,
      clickData.ip_address,
      clickData.user_agent,
      clickData.browser,
      clickData.operating_system,
      clickData.device_type,
      clickData.country || 'Unknown',
      clickData.referrer
    ];
    
    return await database.execute(query, params);
  }

  static async getUrlAnalytics(urlId, days = 30) {
    const query = `
      SELECT 
        DATE(clicked_at) as date,
        COUNT(*) as clicks,
        COUNT(DISTINCT ip_address) as unique_visitors
      FROM url_analytics 
      WHERE url_id = ? AND clicked_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY DATE(clicked_at)
      ORDER BY date DESC
    `;
    
    return await database.execute(query, [urlId, days]);
  }

  static async getBrowserStats(urlId) {
    const query = `
      SELECT browser, COUNT(*) as count
      FROM url_analytics 
      WHERE url_id = ?
      GROUP BY browser
      ORDER BY count DESC
      LIMIT 10
    `;
    
    return await database.execute(query, [urlId]);
  }

  static async getDeviceStats(urlId) {
    const query = `
      SELECT device_type, COUNT(*) as count
      FROM url_analytics 
      WHERE url_id = ?
      GROUP BY device_type
      ORDER BY count DESC
    `;
    
    return await database.execute(query, [urlId]);
  }

  static async getCountryStats(urlId) {
    const query = `
      SELECT country, COUNT(*) as count
      FROM url_analytics 
      WHERE url_id = ?
      GROUP BY country
      ORDER BY count DESC
      LIMIT 10
    `;
    
    return await database.execute(query, [urlId]);
  }

  static async getReferrerStats(urlId) {
    const query = `
      SELECT 
        CASE 
          WHEN referrer IS NULL OR referrer = '' THEN 'Direct'
          ELSE referrer
        END as referrer,
        COUNT(*) as count
      FROM url_analytics 
      WHERE url_id = ?
      GROUP BY referrer
      ORDER BY count DESC
      LIMIT 10
    `;
    
    return await database.execute(query, [urlId]);
  }

  static async getGlobalStats(days = 30) {
    const query = `
      SELECT 
        DATE(clicked_at) as date,
        COUNT(*) as total_clicks,
        COUNT(DISTINCT url_id) as urls_clicked,
        COUNT(DISTINCT ip_address) as unique_visitors
      FROM url_analytics 
      WHERE clicked_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY DATE(clicked_at)
      ORDER BY date DESC
    `;
    
    return await database.execute(query, [days]);
  }

  static async cleanup(days = 90) {
    const query = `
      DELETE FROM url_analytics 
      WHERE clicked_at < DATE_SUB(NOW(), INTERVAL ? DAY)
    `;
    
    return await database.execute(query, [days]);
  }
}

module.exports = AnalyticsModel;