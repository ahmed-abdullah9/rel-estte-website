const AdminService = require('../services/admin.service');
const { successResponse, errorResponse } = require('../utils/response');
const logger = require('../utils/logger');

class AdminController {
  static async getDashboard(req, res, next) {
    try {
      const stats = await AdminService.getDashboardStats();
      return successResponse(res, stats, 'Dashboard data retrieved successfully');
    } catch (error) {
      logger.error('Error getting dashboard stats:', error);
      next(error);
    }
  }

  static async getAllURLs(req, res, next) {
    try {
      const limit = parseInt(req.query.limit) || 50;
      const offset = parseInt(req.query.offset) || 0;
      const search = req.query.search || '';
      
      const urls = await AdminService.getAllURLs(limit, offset, search);
      
      return successResponse(res, urls, 'URLs retrieved successfully');
    } catch (error) {
      logger.error('Error getting all URLs:', error);
      next(error);
    }
  }

  static async getAllUsers(req, res, next) {
    try {
      const limit = parseInt(req.query.limit) || 50;
      const offset = parseInt(req.query.offset) || 0;
      
      const users = await AdminService.getAllUsers(limit, offset);
      
      return successResponse(res, users, 'Users retrieved successfully');
    } catch (error) {
      logger.error('Error getting all users:', error);
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
      
      return successResponse(res, null, 'URL deleted successfully');
    } catch (error) {
      logger.error('Error deleting URL:', error);
      next(error);
    }
  }

  static async deleteUser(req, res, next) {
    try {
      const { id } = req.params;
      
      const deleted = await AdminService.deleteUser(id);
      
      if (!deleted) {
        return errorResponse(res, null, 'User not found or cannot be deleted', 404);
      }
      
      return successResponse(res, null, 'User deleted successfully');
    } catch (error) {
      logger.error('Error deleting user:', error);
      next(error);
    }
  }

  static async getGlobalAnalytics(req, res, next) {
    try {
      const days = parseInt(req.query.days) || 30;
      
      const analytics = await AdminService.getGlobalAnalytics(days);
      
      return successResponse(res, analytics, 'Global analytics retrieved successfully');
    } catch (error) {
      logger.error('Error getting global analytics:', error);
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
      res.setHeader('Content-Disposition', `attachment; filename=${type}-export.csv`);
      
      return res.send(csv);
    } catch (error) {
      logger.error('Error exporting data:', error);
      next(error);
    }
  }
}

module.exports = AdminController;