const express = require('express');
const URLController = require('../controllers/url.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const rateLimitMiddleware = require('../middleware/rate-limit.middleware');

const router = express.Router();

// Public routes
router.post('/shorten', rateLimitMiddleware.shortenLimit, URLController.createShortURL);
router.get('/stats/:shortCode', URLController.getPublicStats);

// Protected routes (require authentication)
router.use(authenticateToken);
router.get('/my-urls', URLController.getUserURLs);
router.get('/analytics/:shortCode', URLController.getURLAnalytics);
router.delete('/:id', URLController.deleteURL);

module.exports = router;