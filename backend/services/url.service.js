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
    if (!originalUrl || !originalUrl.match(/^https?:\/\/.+/)) {
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
      let attempts = 0;
      do {
        shortCode = this.generateShortCode(config.SHORT_CODE_LENGTH);
        attempts++;
        
        if (attempts > 10) {
          throw new Error('Unable to generate unique short code, try again');
        }
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
    const analyticsData = {
      url_id: urlId,
      ip_address: clientInfo.ip_address,
      user_agent: clientInfo.user_agent,
      browser: this.detectBrowser(clientInfo.user_agent),
      operating_system: this.detectOS(clientInfo.user_agent),
      device_type: this.detectDevice(clientInfo.user_agent),
      country: 'Unknown',
      referrer: clientInfo.referrer
    };

    await AnalyticsModel.recordClick(analyticsData);
  }

  static detectBrowser(userAgent) {
    if (!userAgent) return 'Unknown';
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Other';
  }

  static detectOS(userAgent) {
    if (!userAgent) return 'Unknown';
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iOS')) return 'iOS';
    return 'Other';
  }

  static detectDevice(userAgent) {
    if (!userAgent) return 'Unknown';
    if (userAgent.includes('Mobile')) return 'Mobile';
    if (userAgent.includes('Tablet')) return 'Tablet';
    return 'Desktop';
  }

  static async getUserURLs(userId, limit = 50, offset = 0) {
    return await URLModel.findByUserId(userId, limit, offset);
  }

  static async getPublicStats(shortCode) {
    const url = await URLModel.findByShortCode(shortCode);
    if (!url) return null;

    return {
      short_code: url.short_code,
      original_url: url.original_url,
      click_count: url.click_count,
      created_at: url.created_at
    };
  }

  static async getURLAnalytics(shortCode, userId, days = 30) {
    const url = await URLModel.findByShortCode(shortCode);
    
    if (!url || (userId && url.user_id !== userId)) {
      return null;
    }

    const analytics = await AnalyticsModel.getUrlAnalytics(url.id, days);
    
    return {
      url: {
        short_code: url.short_code,
        original_url: url.original_url,
        click_count: url.click_count
      },
      analytics
    };
  }

  static async deleteURL(urlId, userId) {
    const url = await URLModel.findById(urlId);
    
    if (!url || url.user_id !== userId) {
      return false;
    }

    await URLModel.deleteById(urlId);
    return true;
  }
}

module.exports = URLService;