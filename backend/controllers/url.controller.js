const URLService = require('../services/url.service');
const { successResponse, errorResponse } = require('../utils/response');
const logger = require('../utils/logger');

class URLController {
  static async createShortURL(req, res, next) {
    try {
      const { url, customCode } = req.body;
      
      logger.info('Creating short URL request:', { url, customCode, userId: req.user?.id });
      
      if (!url) {
        return errorResponse(res, null, 'URL is required', 400);
      }
      
      const shortUrl = await URLService.createShortURL(url, req.user?.id, customCode);
      
      logger.info('Short URL created successfully:', { 
        shortCode: shortUrl.short_code,
        originalUrl: url 
      });
      
      return successResponse(res, shortUrl, 'URL shortened successfully', 201);
    } catch (error) {
      logger.error('Error creating short URL:', {
        error: error.message,
        stack: error.stack,
        body: req.body,
        userId: req.user?.id
      });
      
      if (error.message.includes('Invalid URL') || error.message.includes('Custom code')) {
        return errorResponse(res, null, error.message, 400);
      }
      
      next(error);
    }
  }

  static async redirectToOriginal(req, res, next) {
    try {
      const { shortCode } = req.params;
      
      logger.info('Redirect request:', { shortCode, ip: req.ip });
      
      const clientInfo = {
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent') || '',
        referrer: req.get('referrer') || '',
        timestamp: new Date()
      };
      
      const originalUrl = await URLService.handleRedirect(shortCode, clientInfo);
      
      if (!originalUrl) {
        logger.warn('Short URL not found:', { shortCode });
        return errorResponse(res, null, 'Short URL not found', 404);
      }
      
      logger.info('Redirecting to:', { shortCode, originalUrl });
      
      return res.redirect(301, originalUrl);
    } catch (error) {
      logger.error('Error handling redirect:', {
        error: error.message,
        stack: error.stack,
        shortCode: req.params.shortCode
      });
      next(error);
    }
  }

  static async getPublicStats(req, res, next) {
    try {
      const { shortCode } = req.params;
      
      const stats = await URLService.getPublicStats(shortCode);
      
      if (!stats) {
        return errorResponse(res, null, 'Short URL not found', 404);
      }
      
      return successResponse(res, stats, 'Stats retrieved successfully');
    } catch (error) {
      logger.error('Error getting public stats:', error);
      next(error);
    }
  }

  static async getUserURLs(req, res, next) {
    try {
      const userId = req.user.id;
      const limit = parseInt(req.query.limit) || 50;
      const offset = parseInt(req.query.offset) || 0;
      
      const urls = await URLService.getUserURLs(userId, limit, offset);
      
      return successResponse(res, urls, 'URLs retrieved successfully');
    } catch (error) {
      logger.error('Error getting user URLs:', error);
      next(error);
    }
  }

  static async getURLAnalytics(req, res, next) {
    try {
      const { shortCode } = req.params;
      const userId = req.user.id;
      const days = parseInt(req.query.days) || 30;
      
      const analytics = await URLService.getURLAnalytics(shortCode, userId, days);
      
      if (!analytics) {
        return errorResponse(res, null, 'URL not found or access denied', 404);
      }
      
      return successResponse(res, analytics, 'Analytics retrieved successfully');
    } catch (error) {
      logger.error('Error getting URL analytics:', error);
      next(error);
    }
  }

  static async deleteURL(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      const deleted = await URLService.deleteURL(id, userId);
      
      if (!deleted) {
        return errorResponse(res, null, 'URL not found or access denied', 404);
      }
      
      return successResponse(res, null, 'URL deleted successfully');
    } catch (error) {
      logger.error('Error deleting URL:', error);
      next(error);
    }
  }
}

module.exports = URLController;