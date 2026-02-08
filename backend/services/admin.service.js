const URLModel = require('../models/URL.model');
const UserModel = require('../models/User.model');
const AnalyticsModel = require('../models/Analytics.model');

class AdminService {
  static async getDashboardStats() {
    const [urlStats, userStats, topUrls] = await Promise.all([
      URLModel.getStats(),
      UserModel.getStats(),
      URLModel.getTopUrls(10)
    ]);

    return {
      urls: urlStats,
      users: userStats,
      top_urls: topUrls
    };
  }

  static async getAllURLs(limit, offset, search) {
    return await URLModel.getAllWithPagination(limit, offset, search);
  }

  static async getAllUsers(limit, offset) {
    return await UserModel.getAllWithPagination(limit, offset);
  }

  static async deleteURL(urlId) {
    const url = await URLModel.findById(urlId);
    if (!url) {
      return false;
    }

    await URLModel.deleteById(urlId);
    return true;
  }

  static async deleteUser(userId) {
    const user = await UserModel.findById(userId);
    if (!user || user.role === 'admin') {
      return false;
    }

    await UserModel.deleteById(userId);
    return true;
  }

  static async exportData(type) {
    switch (type) {
      case 'urls':
        return await URLModel.getAllWithPagination(10000, 0);
      case 'users':
        return await UserModel.getAllWithPagination(10000, 0);
      default:
        throw new Error('Invalid export type');
    }
  }

  static convertToCSV(data) {
    if (!data.length) return '';
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => `"${String(row[header]).replace(/"/g, '""')}"`).join(',')
      )
    ].join('\n');
    
    return csvContent;
  }
}

module.exports = AdminService;