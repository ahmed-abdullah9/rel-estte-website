const URLModel = require('../models/URL.model');
const AnalyticsModel = require('../models/Analytics.model');
const config = require('../config/constants');
const crypto = require('crypto');
const { URL } = require('url');

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
    // Validate URL
    try {
      const urlObj = new URL(originalUrl);
      
      // Check for blocked domains
      if (config.BLOCKED_DOMAINS.includes(urlObj.hostname)) {
        throw new Error('Domain not allowed');
      }
      
      // Check protocol
      if (!config.ALLOWED_PROTOCOLS.includes(urlObj.protocol)) {
        throw new Error('Protocol not allowed');
      }
    } catch (error) {
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

    // Record analytics
    await this.recordAnalytics(url.id, clientInfo);

    return url.original_url;
  }

  static async recordAnalytics(urlId, clientInfo) {
    try {
      const analyticsData = {
        url_id: urlId,
        ip_address: clientInfo.ip_address,
        user_agent: clientInfo.user_agent,
        referrer: clientInfo.referrer,
        browser: this.extractBrowser(clientInfo.user_agent),
        operating_system: this.extractOS(clientInfo.user_agent),
        device_type: this.extractDeviceType(clientInfo.user_agent),
        country: 'Unknown' // Could integrate with GeoIP service
      };

      await AnalyticsModel.recordClick(analyticsData);
    } catch (error) {
      // Log error but don't fail the redirect
      console.error('Analytics recording failed:', error);
    }
  }

  static extractBrowser(userAgent) {
    if (!userAgent) return 'Unknown';
    
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    if (userAgent.includes('Opera')) return 'Opera';
    
    return 'Other';
  }

  static extractOS(userAgent) {
    if (!userAgent) return 'Unknown';
    
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac OS')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iOS')) return 'iOS';
    
    return 'Other';
  }

  static extractDeviceType(userAgent) {
    if (!userAgent) return 'Unknown';
    
    if (userAgent.includes('Mobile')) return 'Mobile';
    if (userAgent.includes('Tablet')) return 'Tablet';
    
    return 'Desktop';
  }

  static async getUserURLs(userId, limit, offset) {
    return await URLModel.findByUserId(userId, limit, offset);
  }

  static async getURLStats(shortCode, userId) {
    const url = await URLModel.findByShortCode(shortCode);
    
    if (!url || (userId && url.user_id !== userId)) {
      return null;
    }

    return {
      id: url.id,
      original_url: url.original_url,
      short_code: url.short_code,
      short_url: `${config.BASE_URL}/${url.short_code}`,
      click_count: url.click_count,
      created_at: url.created_at,
      last_accessed: url.last_accessed
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