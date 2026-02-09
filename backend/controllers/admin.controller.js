const AdminService = require('../services/admin.service');
const { successResponse, errorResponse } = require('../utils/response');
const logger = require('../utils/logger');

class AdminController {
  static async getDashboard(req, res, next) {
    try {
      const stats = await AdminService.getDashboardStats();
      return successResponse(res, stats, 'Dashboard data retrieved successfully');
    } catch (error) {
      logger.error('Dashboard error:', error);
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
      logger.error('Get all URLs error:', error);
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
      
      return successResponse(res, null, 'URL deleted successfully');
    } catch (error) {
      logger.error('Delete URL error:', error);
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
      
      return successResponse(res, null, 'User deleted successfully');
    } catch (error) {
      logger.error('Delete user error:', error);
      next(error);
    }
  }

  static async exportData(req, res, next) {
    try {
      const { type } = req.params;
      const format = req.query.format || 'json';
      
      const data = await AdminService.exportData(type);
      
      if (format === 'csv') {
        const csv = AdminService.convertToCSV(data);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=${type}-export.csv`);
        return res.send(csv);
      }
      
      return successResponse(res, data, `${type} data exported successfully`);
    } catch (error) {
      logger.error('Export data error:', error);
      next(error);
    }
  }
}

module.exports = AdminController;