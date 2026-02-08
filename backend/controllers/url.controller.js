const URLService = require('../services/url.service');
const { successResponse, errorResponse } = require('../utils/response');
const { validateURL } = require('../validators/url.validator');
const logger = require('../utils/logger');

class URLController {
  static async createShortURL(req, res, next) {
    try {
      const { url, customCode } = req.body;
      
      logger.info('📝 Shorten request received:', { url });
      
      // Validate input
      const validation = validateURL(url, customCode);
      if (!validation.isValid) {
        return errorResponse(res, validation.errors, 'Validation failed', 400);
      }
      
      // Create short URL
      const userId = req.user?.id || null;
      const result = await URLService.createShortURL(url, userId, customCode);
      
      logger.info('✅ URL shortened successfully:', result.short_code);
      
      return successResponse(res, result, 'URL shortened successfully', 201);
    } catch (error) {
      logger.error('URL shortening error:', error);
      next(error);
    }
  }

  static async redirectToOriginal(req, res, next) {
    try {
      const { shortCode } = req.params;
      
      // Get client info for analytics
      const clientInfo = {
        ip_address: req.ip,
        user_agent: req.get('User-Agent'),
        referrer: req.get('Referrer') || null,
        browser: req.get('User-Agent')?.split(' ')[0] || 'Unknown',
        operating_system: req.get('User-Agent')?.includes('Windows') ? 'Windows' : 
                         req.get('User-Agent')?.includes('Mac') ? 'macOS' : 
                         req.get('User-Agent')?.includes('Linux') ? 'Linux' : 'Unknown',
        device_type: req.get('User-Agent')?.includes('Mobile') ? 'Mobile' : 'Desktop'
      };
      
      const originalUrl = await URLService.handleRedirect(shortCode, clientInfo);
      
      if (!originalUrl) {
        return res.status(404).send(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Link Not Found</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
          </head>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h1>404 - Link Not Found</h1>
            <p>The short link you clicked does not exist or has been removed.</p>
            <a href="/" style="color: #007bff;">Create a new short link</a>
          </body>
          </html>
        `);
      }
      
      logger.info('🔄 Redirecting:', { shortCode, originalUrl });
      return res.redirect(301, originalUrl);
      
    } catch (error) {
      logger.error('Redirect error:', error);
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
      
      return successResponse(res, stats);
    } catch (error) {
      logger.error('Stats error:', error);
      next(error);
    }
  }

  static async getUserURLs(req, res, next) {
    try {
      const userId = req.user.id;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;
      
      const urls = await URLService.getUserURLs(userId, limit, offset);
      
      return successResponse(res, urls);
    } catch (error) {
      logger.error('Get user URLs error:', error);
      next(error);
    }
  }

  static async getURLAnalytics(req, res, next) {
    try {
      const { shortCode } = req.params;
      const userId = req.user.id;
      const days = parseInt(req.query.days) || 30;
      
      const analytics = await URLService.getAnalytics(shortCode, userId, days);
      
      if (!analytics) {
        return errorResponse(res, null, 'URL not found or access denied', 404);
      }
      
      return successResponse(res, analytics);
    } catch (error) {
      logger.error('Analytics error:', error);
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
      logger.error('Delete URL error:', error);
      next(error);
    }
  }
}

module.exports = URLController;