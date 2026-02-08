const urlService = require('../services/url.service');
const analyticsService = require('../services/analytics.service');
const { successResponse, errorResponse } = require('../utils/response');
const { validateURL } = require('../validators/url.validator');
const logger = require('../utils/logger');

class URLController {
  static async createShortURL(req, res, next) {
    try {
      const { url, customCode } = req.body;
      
      // Validate input
      const validation = validateURL(url, customCode);
      if (!validation.isValid) {
        return errorResponse(res, validation.errors, 'Validation failed', 400);
      }

      const userId = req.user?.id || null;
      const shortUrl = await urlService.createShortURL(url, userId, customCode);
      
      logger.info(`Short URL created: ${shortUrl.short_code}`, { userId, originalUrl: url });
      
      return successResponse(res, shortUrl, 'URL shortened successfully', 201);
    } catch (error) {
      logger.error('Error creating short URL:', error);
      next(error);
    }
  }

  static async getUserURLs(req, res, next) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 20 } = req.query;
      
      const offset = (page - 1) * limit;
      const urls = await urlService.getUserURLs(userId, parseInt(limit), offset);
      
      return successResponse(res, urls, 'URLs retrieved successfully');
    } catch (error) {
      logger.error('Error fetching user URLs:', error);
      next(error);
    }
  }

  static async getURLStats(req, res, next) {
    try {
      const { shortCode } = req.params;
      const userId = req.user.id;
      
      const stats = await urlService.getURLStats(shortCode, userId);
      
      if (!stats) {
        return errorResponse(res, null, 'URL not found or access denied', 404);
      }
      
      return successResponse(res, stats, 'URL statistics retrieved successfully');
    } catch (error) {
      logger.error('Error fetching URL stats:', error);
      next(error);
    }
  }

  static async getURLAnalytics(req, res, next) {
    try {
      const { shortCode } = req.params;
      const { days = 30 } = req.query;
      const userId = req.user.id;
      
      const analytics = await analyticsService.getURLAnalytics(shortCode, userId, parseInt(days));
      
      if (!analytics) {
        return errorResponse(res, null, 'URL not found or access denied', 404);
      }
      
      return successResponse(res, analytics, 'URL analytics retrieved successfully');
    } catch (error) {
      logger.error('Error fetching URL analytics:', error);
      next(error);
    }
  }

  static async deleteURL(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      const deleted = await urlService.deleteURL(id, userId);
      
      if (!deleted) {
        return errorResponse(res, null, 'URL not found or access denied', 404);
      }
      
      logger.info(`URL deleted: ${id}`, { userId });
      
      return successResponse(res, null, 'URL deleted successfully');
    } catch (error) {
      logger.error('Error deleting URL:', error);
      next(error);
    }
  }

  static async redirectToOriginal(req, res, next) {
    try {
      const { shortCode } = req.params;
      
      // Get client info for analytics
      const clientInfo = {
        ip_address: req.ip || req.connection.remoteAddress,
        user_agent: req.get('User-Agent') || 'Unknown',
        referrer: req.get('Referrer') || req.get('Referer') || null
      };
      
      const originalUrl = await urlService.handleRedirect(shortCode, clientInfo);
      
      if (!originalUrl) {
        return res.status(404).sendFile('404.html', { root: 'public' });
      }
      
      // Redirect to original URL
      res.redirect(301, originalUrl);
    } catch (error) {
      logger.error('Error handling redirect:', error);
      next(error);
    }
  }
}

module.exports = URLController;