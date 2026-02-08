const express = require('express');
const URLController = require('../controllers/url.controller');

const router = express.Router();

// Handle short URL redirects - this catches /:shortCode
router.get('/:shortCode([a-zA-Z0-9]{6})', URLController.redirectToOriginal);

module.exports = router;