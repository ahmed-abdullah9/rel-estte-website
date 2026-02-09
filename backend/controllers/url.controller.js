const URLService = require('../services/url.service');
const { successResponse, errorResponse } = require('../utils/response');
const { validateURL } = require('../validators/url.validator');
const logger = require('../utils/logger');

class URLController {
  static async createShortURL(req, res, next) {
    try {
      const { url, customCode } = req.body;
      const userId = req.user?.id || null;
      
      logger.info('Creating short URL request:', { url, customCode, userId });
      
      // Validate input
      const validation = validateURL(url, customCode);
      if (!validation.isValid) {
        return errorResponse(res, validation.errors, 'Validation failed', 400);
      }
      
      // Create short URL
      const shortURL = await URLService.createShortURL(url, userId, customCode);
      
      logger.info('Short URL created successfully:', shortURL);
      
      return successResponse(res, shortURL, 'Short URL created successfully', 201);
    } catch (error) {
      logger.error('Error creating short URL:', error);
      next(error);
    }
  }

  static async redirectToOriginal(req, res, next) {
    try {
      const { shortCode } = req.params;
      
      const clientInfo = {
        ip_address: req.ip || req.connection.remoteAddress,
        user_agent: req.get('User-Agent') || '',
        referrer: req.get('Referer') || null
      };
      
      const originalUrl = await URLService.handleRedirect(shortCode, clientInfo);
      
      if (!originalUrl) {
        return res.status(404).send(`
          <!DOCTYPE html>
          <html><head><title>Link Not Found</title></head>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h1>🔗 Link Not Found</h1>
            <p>The short URL you're looking for doesn't exist or has been removed.</p>
            <a href="/" style="color: #007bff;">← Go Home</a>
          </body></html>
        `);
      }
      
      return res.redirect(302, originalUrl);
    } catch (error) {
      logger.error('Error in redirect:', error);
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

  static async getPublicStats(req, res, next) {
    try {
      const { shortCode } = req.params;
      const stats = await URLService.getPublicStats(shortCode);
      
      if (!stats) {
        return errorResponse(res, null, 'URL not found', 404);
      }
      
      return successResponse(res, stats, 'Statistics retrieved successfully');
    } catch (error) {
      logger.error('Error getting public stats:', error);
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