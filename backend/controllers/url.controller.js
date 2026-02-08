const URLService = require('../services/url.service');
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
      
      // Create short URL
      const shortUrl = await URLService.createShortURL(
        url, 
        req.user?.id || null, 
        customCode
      );
      
      logger.info('Short URL created:', { 
        shortCode: shortUrl.short_code,
        originalUrl: url,
        userId: req.user?.id || 'anonymous'
      });
      
      return successResponse(res, shortUrl, 'URL shortened successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  static async redirectToOriginal(req, res, next) {
    try {
      const { shortCode } = req.params;
      
      if (!shortCode || shortCode.length !== 6) {
        return errorResponse(res, null, 'Invalid short code', 400);
      }
      
      const clientInfo = {
        ip_address: req.ip || req.connection.remoteAddress,
        user_agent: req.get('user-agent') || 'Unknown',
        browser: req.get('user-agent') ? 'Browser' : 'Unknown',
        operating_system: 'Unknown',
        device_type: 'Desktop',
        country: 'Unknown',
        referrer: req.get('referrer') || null
      };
      
      const originalUrl = await URLService.handleRedirect(shortCode, clientInfo);
      
      if (!originalUrl) {
        return res.status(404).send(`
          <html>
            <head><title>Link Not Found</title></head>
            <body style="font-family:Arial;text-align:center;padding:50px;">
              <h1>🔗 Link Not Found</h1>
              <p>The short link you're looking for doesn't exist or has expired.</p>
              <a href="/">← Go Home</a>
            </body>
          </html>
        `);
      }
      
      return res.redirect(301, originalUrl);
    } catch (error) {
      next(error);
    }
  }

  static async getPublicStats(req, res, next) {
    try {
      const { shortCode } = req.params;
      
      const url = await URLService.getURLStats(shortCode);
      
      if (!url) {
        return errorResponse(res, null, 'URL not found', 404);
      }
      
      return successResponse(res, {
        short_code: url.short_code,
        click_count: url.click_count,
        created_at: url.created_at
      });
    } catch (error) {
      next(error);
    }
  }

  static async getUserURLs(req, res, next) {
    try {
      const userId = req.user.id;
      const limit = parseInt(req.query.limit) || 50;
      const offset = parseInt(req.query.offset) || 0;
      
      const urls = await URLService.getUserURLs(userId, limit, offset);
      
      return successResponse(res, urls);
    } catch (error) {
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
      
      return successResponse(res, analytics);
    } catch (error) {
      next(error);
    }
  }

  static async deleteURL(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      const result = await URLService.deleteURL(id, userId);
      
      if (!result) {
        return errorResponse(res, null, 'URL not found or access denied', 404);
      }
      
      return successResponse(res, null, 'URL deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = URLController;