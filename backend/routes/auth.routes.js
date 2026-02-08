const express = require('express');
const AuthController = require('../controllers/auth.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const rateLimitMiddleware = require('../middleware/rate-limit.middleware');

const router = express.Router();

// Public routes
router.post('/register', rateLimitMiddleware.authLimit, AuthController.register);
router.post('/login', rateLimitMiddleware.authLimit, AuthController.login);

// Protected routes
router.use(authenticateToken);
router.get('/profile', AuthController.getProfile);
router.post('/refresh', AuthController.refreshToken);

module.exports = router;