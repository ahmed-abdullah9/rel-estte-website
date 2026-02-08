const { URL } = require('url');
const config = require('../config/constants');

const validateURL = (url, customCode = null) => {
  const errors = {};
  
  // Validate URL
  if (!url) {
    errors.url = 'URL is required';
  } else {
    try {
      const urlObj = new URL(url);
      
      // Check protocol
      if (!config.ALLOWED_PROTOCOLS.includes(urlObj.protocol)) {
        errors.url = 'Only HTTP and HTTPS URLs are allowed';
      }
      
      // Check for blocked domains
      if (config.BLOCKED_DOMAINS.includes(urlObj.hostname)) {
        errors.url = 'Domain not allowed';
      }
    } catch (error) {
      errors.url = 'Invalid URL format';
    }
  }
  
  // Validate custom code if provided
  if (customCode) {
    if (!/^[a-zA-Z0-9]{3,20}$/.test(customCode)) {
      errors.customCode = 'Custom code must be 3-20 alphanumeric characters';
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

module.exports = {
  validateURL
};