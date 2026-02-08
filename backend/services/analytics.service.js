const AnalyticsModel = require('../models/Analytics.model');
const URLModel = require('../models/URL.model');

class AnalyticsService {
  static async getURLAnalytics(shortCode, userId, days = 30) {
    const url = await URLModel.findByShortCode(shortCode);
    
    if (!url || (userId && url.user_id !== userId)) {
      return null;
    }

    const [
      dailyStats,
      browserStats,
      deviceStats,
      countryStats,
      referrerStats
    ] = await Promise.all([
      AnalyticsModel.getUrlAnalytics(url.id, days),
      AnalyticsModel.getBrowserStats(url.id),
      AnalyticsModel.getDeviceStats(url.id),
      AnalyticsModel.getCountryStats(url.id),
      AnalyticsModel.getReferrerStats(url.id)
    ]);

    return {
      url: {
        id: url.id,
        original_url: url.original_url,
        short_code: url.short_code,
        click_count: url.click_count
      },
      daily_stats: dailyStats,
      browser_stats: browserStats,
      device_stats: deviceStats,
      country_stats: countryStats,
      referrer_stats: referrerStats
    };
  }

  static async getGlobalAnalytics(days = 30) {
    const [
      dailyStats,
      urlStats,
      userStats
    ] = await Promise.all([
      AnalyticsModel.getGlobalStats(days),
      URLModel.getStats(),
      require('../models/User.model').getStats()
    ]);

    return {
      daily_stats: dailyStats,
      url_stats: urlStats,
      user_stats: userStats
    };
  }
}

module.exports = AnalyticsService;