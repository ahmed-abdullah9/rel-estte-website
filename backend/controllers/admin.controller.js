const AdminService = require('../services/admin.service');
const { successResponse, errorResponse } = require('../utils/response');
const logger = require('../utils/logger');

class AdminController {
  static async getDashboard(req, res, next) {
    try {
      const stats = await AdminService.getDashboardStats();
      
      return successResponse(res, stats);
    } catch (error) {
      next(error);
    }
  }

  static async getAllURLs(req, res, next) {
    try {
      const limit = parseInt(req.query.limit) || 50;
      const offset = parseInt(req.query.offset) || 0;
      const search = req.query.search || '';
      
      const urls = await AdminService.getAllURLs(limit, offset, search);
      
      return successResponse(res, urls);
    } catch (error) {
      next(error);
    }
  }

  static async getAllUsers(req, res, next) {
    try {
      const limit = parseInt(req.query.limit) || 50;
      const offset = parseInt(req.query.offset) || 0;
      
      const users = await AdminService.getAllUsers(limit, offset);
      
      return successResponse(res, users);
    } catch (error) {
      next(error);
    }
  }

  static async deleteURL(req, res, next) {
    try {
      const { id } = req.params;
      
      const result = await AdminService.deleteURL(id);
      
      if (!result) {
        return errorResponse(res, null, 'URL not found', 404);
      }
      
      logger.info('Admin deleted URL:', { urlId: id, adminId: req.user.id });
      
      return successResponse(res, null, 'URL deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  static async deleteUser(req, res, next) {
    try {
      const { id } = req.params;
      
      const result = await AdminService.deleteUser(id);
      
      if (!result) {
        return errorResponse(res, null, 'User not found or cannot delete admin', 404);
      }
      
      logger.info('Admin deleted user:', { userId: id, adminId: req.user.id });
      
      return successResponse(res, null, 'User deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  static async exportData(req, res, next) {
    try {
      const { type } = req.params; // 'urls' or 'users'
      
      const data = await AdminService.exportData(type);
      const csv = AdminService.convertToCSV(data);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${type}_export_${Date.now()}.csv`);
      
      return res.send(csv);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AdminController;