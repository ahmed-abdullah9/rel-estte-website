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

// URL management
router.get('/urls', AdminController.getAllURLs);
router.delete('/urls/:id', AdminController.deleteURL);

// User management
router.get('/users', AdminController.getAllUsers);
router.delete('/users/:id', AdminController.deleteUser);

// Data export
router.get('/export/:type', AdminController.exportData);

module.exports = router;