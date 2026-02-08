const AdminService = require('../services/admin.service');
const AnalyticsService = require('../services/analytics.service');
const { successResponse, errorResponse } = require('../utils/response');
const logger = require('../utils/logger');

class AdminController {
  static async getDashboardStats(req, res, next) {
    try {
      const stats = await AdminService.getDashboardStats();
      return successResponse(res, stats);
    } catch (error) {
      logger.error('Dashboard stats error:', error);
      next(error);
    }
  }

  static async getGlobalAnalytics(req, res, next) {
    try {
      const days = parseInt(req.query.days) || 30;
      const analytics = await AnalyticsService.getGlobalAnalytics(days);
      return successResponse(res, analytics);
    } catch (error) {
      logger.error('Global analytics error:', error);
      next(error);
    }
  }

  static async getAllURLs(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;
      const search = req.query.search || '';
      const offset = (page - 1) * limit;
      
      const urls = await AdminService.getAllURLs(limit, offset, search);
      return successResponse(res, urls);
    } catch (error) {
      logger.error('Get all URLs error:', error);
      next(error);
    }
  }

  static async getAllUsers(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;
      const offset = (page - 1) * limit;
      
      const users = await AdminService.getAllUsers(limit, offset);
      return successResponse(res, users);
    } catch (error) {
      logger.error('Get all users error:', error);
      next(error);
    }
  }

  static async deleteURL(req, res, next) {
    try {
      const { id } = req.params;
      
      const deleted = await AdminService.deleteURL(id);
      if (!deleted) {
        return errorResponse(res, null, 'URL not found', 404);
      }
      
      logger.info('Admin deleted URL:', { id });
      return successResponse(res, null, 'URL deleted successfully');
    } catch (error) {
      logger.error('Admin delete URL error:', error);
      next(error);
    }
  }

  static async deleteUser(req, res, next) {
    try {
      const { id } = req.params;
      
      const deleted = await AdminService.deleteUser(id);
      if (!deleted) {
        return errorResponse(res, null, 'User not found or cannot delete admin', 404);
      }
      
      logger.info('Admin deleted user:', { id });
      return successResponse(res, null, 'User deleted successfully');
    } catch (error) {
      logger.error('Admin delete user error:', error);
      next(error);
    }
  }

  static async exportData(req, res, next) {
    try {
      const { type } = req.query;
      
      if (!['urls', 'users'].includes(type)) {
        return errorResponse(res, null, 'Invalid export type', 400);
      }
      
      const data = await AdminService.exportData(type);
      const csv = AdminService.convertToCSV(data);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${type}-export.csv`);
      
      return res.send(csv);
    } catch (error) {
      logger.error('Export error:', error);
      next(error);
    }
  }
}

module.exports = AdminController;