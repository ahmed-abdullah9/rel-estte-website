const express = require('express');
const AdminController = require('../controllers/admin.controller');
const { authenticateToken, requireAdmin } = require('../middleware/auth.middleware');

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticateToken, requireAdmin);

// Dashboard
router.get('/stats', AdminController.getDashboardStats);
router.get('/analytics', AdminController.getGlobalAnalytics);

// URLs Management
router.get('/urls', AdminController.getAllURLs);
router.delete('/urls/:id', AdminController.deleteURL);

// Users Management
router.get('/users', AdminController.getAllUsers);
router.delete('/users/:id', AdminController.deleteUser);

// Export
router.get('/export', AdminController.exportData);

module.exports = router;