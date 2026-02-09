const AdminService = require('../services/admin.service');
const { successResponse, errorResponse } = require('../utils/response');
const logger = require('../utils/logger');

class AdminController {
  static async getDashboardStats(req, res, next) {
    try {
      const stats = await AdminService.getDashboardStats();
      return successResponse(res, stats, 'Dashboard stats retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getAllURLs(req, res, next) {
    try {
      const { limit = 50, offset = 0, search = '' } = req.query;
      const urls = await AdminService.getAllURLs(
        parseInt(limit), 
        parseInt(offset), 
        search
      );
      return successResponse(res, urls, 'URLs retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getAllUsers(req, res, next) {
    try {
      const { limit = 50, offset = 0 } = req.query;
      const users = await AdminService.getAllUsers(parseInt(limit), parseInt(offset));
      return successResponse(res, users, 'Users retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async deleteURL(req, res, next) {
    try {
      const { id } = req.params;
      const deleted = await AdminService.deleteURL(parseInt(id));
      
      if (!deleted) {
        return errorResponse(res, null, 'URL not found', 404);
      }
      
      logger.info('URL deleted by admin:', { urlId: id, adminId: req.user.id });
      return successResponse(res, null, 'URL deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  static async deleteUser(req, res, next) {
    try {
      const { id } = req.params;
      const deleted = await AdminService.deleteUser(parseInt(id));
      
      if (!deleted) {
        return errorResponse(res, null, 'User not found or cannot delete admin user', 404);
      }
      
      logger.info('User deleted by admin:', { userId: id, adminId: req.user.id });
      return successResponse(res, null, 'User deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  static async exportData(req, res, next) {
    try {
      const { type } = req.params;
      
      if (!['urls', 'users'].includes(type)) {
        return errorResponse(res, null, 'Invalid export type', 400);
      }
      
      const data = await AdminService.exportData(type);
      const csv = AdminService.convertToCSV(data);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${type}-export-${Date.now()}.csv"`);
      
      return res.send(csv);
    } catch (error) {
      next(error);
    }
  }

  static async getGlobalAnalytics(req, res, next) {
    try {
      const { days = 30 } = req.query;
      const analytics = await require('../services/analytics.service').getGlobalAnalytics(parseInt(days));
      return successResponse(res, analytics, 'Global analytics retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AdminController;