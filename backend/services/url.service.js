const URLModel = require('../models/URL.model');
const AnalyticsModel = require('../models/Analytics.model');
const config = require('../config/constants');
const logger = require('../utils/logger');

class URLService {
  static generateShortCode(length = 6) {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return result;
  }

  static async createShortURL(originalUrl, userId = null, customCode = null) {
    // Basic URL validation
    if (!originalUrl || !originalUrl.startsWith('http')) {
      throw new Error('Invalid URL format');
    }

    // Generate or validate short code
    let shortCode;
    
    if (customCode) {
      // Validate custom code
      if (!/^[a-zA-Z0-9]{3,20}$/.test(customCode)) {
        throw new Error('Custom code must be 3-20 alphanumeric characters');
      }
      
      // Check if custom code is available
      const exists = await URLModel.shortCodeExists(customCode);
      if (exists) {
        throw new Error('Custom code already taken');
      }
      
      shortCode = customCode;
    } else {
      // Generate unique short code
      do {
        shortCode = this.generateShortCode(config.SHORT_CODE_LENGTH);
      } while (await URLModel.shortCodeExists(shortCode));
    }

    // Create URL record
    const urlData = {
      original_url: originalUrl,
      short_code: shortCode,
      user_id: userId
    };

    const url = await URLModel.create(urlData);

    return {
      id: url.id,
      original_url: originalUrl,
      short_code: shortCode,
      short_url: `${config.BASE_URL}/${shortCode}`,
      created_at: new Date(),
      click_count: 0
    };
  }

  static async handleRedirect(shortCode, clientInfo) {
    const url = await URLModel.findByShortCode(shortCode);
    
    if (!url) {
      return null;
    }

    // Update click count
    await URLModel.updateClickCount(shortCode);

    // Record analytics if model exists
    try {
      await this.recordAnalytics(url.id, clientInfo);
    } catch (error) {
      logger.warn('Analytics recording failed:', error.message);
    }

    return url.original_url;
  }

  static async recordAnalytics(urlId, clientInfo) {
    try {
      await AnalyticsModel.recordClick({
        url_id: urlId,
        ...clientInfo
      });
    } catch (error) {
      logger.warn('Failed to record analytics:', error.message);
    }
  }

  static async getPublicStats(shortCode) {
    const url = await URLModel.findByShortCode(shortCode);
    
    if (!url) {
      return null;
    }

    return {
      short_code: url.short_code,
      click_count: url.click_count,
      created_at: url.created_at
    };
  }

  static async getUserURLs(userId, limit, offset) {
    return await URLModel.findByUserId(userId, limit, offset);
  }

  static async getAnalytics(shortCode, userId, days) {
    const url = await URLModel.findByShortCode(shortCode);
    
    if (!url || (userId && url.user_id !== userId)) {
      return null;
    }

    try {
      return await AnalyticsModel.getUrlAnalytics(url.id, days);
    } catch (error) {
      logger.warn('Analytics retrieval failed:', error.message);
      return {
        url: {
          id: url.id,
          original_url: url.original_url,
          short_code: url.short_code,
          click_count: url.click_count
        },
        daily_stats: [],
        browser_stats: [],
        device_stats: [],
        country_stats: [],
        referrer_stats: []
      };
    }
  }

  static async deleteURL(id, userId) {
    const url = await URLModel.findById(id);
    
    if (!url || (userId && url.user_id !== userId)) {
      return false;
    }

    await URLModel.deleteById(id);
    return true;
  }
}

module.exports = URLService;