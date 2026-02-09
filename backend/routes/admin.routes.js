const express = require('express');
const AdminController = require('../controllers/admin.controller');
const { authenticateToken, requireAdmin } = require('../middleware/auth.middleware');
const rateLimitMiddleware = require('../middleware/rate-limit.middleware');

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticateToken);
router.use(requireAdmin);
router.use(rateLimitMiddleware.adminLimit);

// Dashboard
router.get('/dashboard', AdminController.getDashboard);

// URL Management
router.get('/urls', AdminController.getAllURLs);
router.delete('/urls/:id', AdminController.deleteURL);

// User Management
router.get('/users', AdminController.getAllUsers);
router.delete('/users/:id', AdminController.deleteUser);

// Analytics
router.get('/analytics/global', AdminController.getGlobalAnalytics);

// Export Data
router.get('/export/:type', AdminController.exportData);

module.exports = router;