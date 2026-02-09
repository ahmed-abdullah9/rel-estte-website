/* ═══════════════════════════════════════════════════════════════
   LINKSHORT - MAIN APPLICATION JAVASCRIPT
   ═══════════════════════════════════════════════════════════════ */

// Application State
const AppState = {
  currentUser: null,
  authToken: null,
  isLoading: false,
  urls: [],
  currentPage: 1,
  totalPages: 1
};

// API Configuration
const API = {
  baseURL: '/api',
  
  // Helper method for API calls
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(AppState.authToken && { 
          'Authorization': `Bearer ${AppState.authToken}` 
        })
      },
      ...options
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}`);
      }
      
      return data;
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  },

  // URL Shortening
  async shortenURL(originalUrl, customCode = null) {
    return this.request('/shorten', {
      method: 'POST',
      body: { url: originalUrl, custom_code: customCode }
    });
  },

  // Get user's URLs
  async getUserURLs(page = 1, limit = 10) {
    return this.request(`/my-urls?page=${page}&limit=${limit}`);
  },

  // Get public stats
  async getPublicStats(shortCode) {
    return this.request(`/stats/${shortCode}`);
  },

  // Authentication
  async login(email, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: { email, password }
    });
  },

  async register(email, password) {
    return this.request('/auth/register', {
      method: 'POST',
      body: { email, password }
    });
  },

  async getProfile() {
    return this.request('/auth/profile');
  },

  // Admin endpoints
  async getDashboardStats() {
    return this.request('/admin/dashboard');
  },

  async getAllURLs(page = 1, limit = 50, search = '') {
    return this.request(`/admin/urls?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`);
  }
};

// UI Helper Functions
const UI = {
  // Show loading state
  showLoading(element, text = 'Loading...') {
    if (typeof element === 'string') {
      element = document.getElementById(element);
    }
    if (!element) return;

    element.disabled = true;
    element.innerHTML = `
      <div class="spinner spinner-sm"></div>
      <span>${text}</span>
    `;
    element.classList.add('btn-loading');
  },

  // Hide loading state
  hideLoading(element, originalText = 'Submit') {
    if (typeof element === 'string') {
      element = document.getElementById(element);
    }
    if (!element) return;

    element.disabled = false;
    element.innerHTML = originalText;
    element.classList.remove('btn-loading');
  },

  // Show alert
  showAlert(message, type = 'info', container = null) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.innerHTML = `
      <div class="alert-icon">
        ${this.getAlertIcon(type)}
      </div>
      <div class="alert-message">${message}</div>
      <button type="button" class="alert-close" onclick="this.parentElement.remove()">
        <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
        </svg>
      </button>
    `;

    const targetContainer = container || document.querySelector('.alerts-container') || document.body;
    targetContainer.insertBefore(alertDiv, targetContainer.firstChild);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (alertDiv.parentElement) {
        alertDiv.remove();
      }
    }, 5000);

    return alertDiv;
  },

  // Get alert icon
  getAlertIcon(type) {
    const icons = {
      success: '<svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/></svg>',
      error: '<svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293 5.354 4.646z"/></svg>',
      warning: '<svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/></svg>',
      info: '<svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/></svg>'
    };
    return icons[type] || icons.info;
  },

  // Show modal
  showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  },

  // Hide modal
  hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  },

  // Copy to clipboard
  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        document.body.removeChild(textArea);
        return true;
      } catch (err) {
        document.body.removeChild(textArea);
        return false;
      }
    }
  },

  // Format date
  formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  // Format number
  formatNumber(num) {
    return new Intl.NumberFormat().format(num);
  }
};

// URL Shortener Core Functionality
const URLShortener = {
  // Initialize URL shortener
  init() {
    this.bindEvents();
    this.loadSavedSession();
  },

  // Bind event listeners
  bindEvents() {
    // URL Shortening Form
    const shortenForm = document.getElementById('shortenForm');
    if (shortenForm) {
      shortenForm.addEventListener('submit', this.handleShortenSubmit.bind(this));
    }

    // Copy button
    document.addEventListener('click', (e) => {
      if (e.target.matches('.copy-btn') || e.target.closest('.copy-btn')) {
        this.handleCopyClick(e);
      }
    });

    // QR Code button
    document.addEventListener('click', (e) => {
      if (e.target.matches('.qr-btn') || e.target.closest('.qr-btn')) {
        this.handleQRClick(e);
      }
    });

    // Modal close buttons
    document.addEventListener('click', (e) => {
      if (e.target.matches('.modal-close') || e.target.closest('.modal-close')) {
        const modal = e.target.closest('.modal');
        if (modal) UI.hideModal(modal.id);
      }
    });

    // Close modal on backdrop click
    document.addEventListener('click', (e) => {
      if (e.target.matches('.modal')) {
        UI.hideModal(e.target.id);
      }
    });
  },

  // Handle URL shortening form submission
  async handleShortenSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    const originalUrl = formData.get('url');
    const customCode = formData.get('custom_code') || null;
    const submitBtn = form.querySelector('button[type="submit"]');

    if (!originalUrl) {
      UI.showAlert('Please enter a URL', 'error');
      return;
    }

    // Validate URL format
    if (!this.isValidURL(originalUrl)) {
      UI.showAlert('Please enter a valid URL (must start with http:// or https://)', 'error');
      return;
    }

    try {
      UI.showLoading(submitBtn, 'Shortening...');
      
      const response = await API.shortenURL(originalUrl, customCode);
      
      if (response.success) {
        this.displayResult(response.data);
        form.reset();
        UI.showAlert('URL shortened successfully!', 'success');
      } else {
        throw new Error(response.message || 'Failed to shorten URL');
      }
      
    } catch (error) {
      console.error('Shortening error:', error);
      UI.showAlert(error.message || 'Failed to shorten URL. Please try again.', 'error');
    } finally {
      UI.hideLoading(submitBtn, 'Shorten URL');
    }
  },

  // Validate URL format
  isValidURL(string) {
    try {
      const url = new URL(string);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (_) {
      return false;
    }
  },

  // Display shortening result
  displayResult(data) {
    const resultDiv = document.getElementById('result');
    const errorDiv = document.getElementById('errorMessage');
    
    if (errorDiv) errorDiv.style.display = 'none';
    
    if (resultDiv) {
      resultDiv.innerHTML = `
        <div class="card">
          <div class="card-body">
            <h3 class="heading-4 mb-4">✅ URL Shortened Successfully!</h3>
            
            <div class="form-group mb-4">
              <label class="text-sm font-medium text-secondary">Original URL:</label>
              <div class="input-display">${this.truncateURL(data.original_url)}</div>
            </div>
            
            <div class="form-group mb-4">
              <label class="text-sm font-medium text-secondary">Short URL:</label>
              <div class="short-url-display">
                <input type="text" class="input" value="${data.short_url}" readonly id="shortUrlInput">
                <button type="button" class="btn btn-secondary copy-btn" data-url="${data.short_url}">
                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/>
                    <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/>
                  </svg>
                  Copy
                </button>
              </div>
            </div>
            
            <div class="result-stats">
              <div class="stat">
                <span class="stat-label">Clicks:</span>
                <span class="stat-value">${UI.formatNumber(data.click_count || 0)}</span>
              </div>
              <div class="stat">
                <span class="stat-label">Created:</span>
                <span class="stat-value">${UI.formatDate(data.created_at)}</span>
              </div>
            </div>
            
            <div class="result-actions">
              <button type="button" class="btn btn-tertiary qr-btn" data-url="${data.short_url}">
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M6 0H0v6h6V0zM5 1v4H1V1h4zm1 5V0h3.5L8 2.5V6H7zm1 4.5V10h3.5l-1.5 1.5V10.5zm4.5.5V10h1v1.5H11.5zM0 7v6h6v-6H0zm1 1v4h4V8H1zm7 1.5V8h1v1.5H8zM9 10v1.5H8V10h1zm1-1.5V10h1V8.5h-1zM14 7.5V6h-3v3.5h3V7.5zm-2-1.5h1v2h-1V6zm-5 7v1.5h1V12H7zm3 1.5V12h1v1.5h-1zm-1-3V9h1v1.5H9z"/>
                </svg>
                QR Code
              </button>
              <button type="button" class="btn btn-tertiary" onclick="URLShortener.resetForm()">
                Create Another
              </button>
            </div>
          </div>
        </div>
      `;
      
      resultDiv.style.display = 'block';
      resultDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  },

  // Handle copy button click
  async handleCopyClick(e) {
    e.preventDefault();
    const button = e.target.closest('.copy-btn');
    const url = button.dataset.url;
    
    if (!url) return;
    
    const success = await UI.copyToClipboard(url);
    
    if (success) {
      // Temporarily change button text
      const originalText = button.innerHTML;
      button.innerHTML = `
        <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
        </svg>
        Copied!
      `;
      button.classList.add('btn-success');
      
      setTimeout(() => {
        button.innerHTML = originalText;
        button.classList.remove('btn-success');
      }, 2000);
      
      UI.showAlert('URL copied to clipboard!', 'success');
    } else {
      UI.showAlert('Failed to copy URL. Please copy manually.', 'error');
    }
  },

  // Handle QR code button click
  handleQRClick(e) {
    e.preventDefault();
    const button = e.target.closest('.qr-btn');
    const url = button.dataset.url;
    
    if (!url) return;
    
    this.showQRCode(url);
  },

  // Show QR code modal
  showQRCode(url) {
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}`;
    
    // Create or update QR modal
    let qrModal = document.getElementById('qrModal');
    if (!qrModal) {
      qrModal = document.createElement('div');
      qrModal.id = 'qrModal';
      qrModal.className = 'modal';
      document.body.appendChild(qrModal);
    }
    
    qrModal.innerHTML = `
      <div class="modal-content" style="max-width: 400px;">
        <div class="modal-header">
          <h3 class="heading-4">QR Code</h3>
          <button type="button" class="btn btn-tertiary btn-icon modal-close">
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
            </svg>
          </button>
        </div>
        <div class="modal-body text-center">
          <img src="${qrApiUrl}" alt="QR Code" class="qr-code-image" style="max-width: 100%; border-radius: var(--radius-lg);">
          <p class="text-sm text-secondary mt-4">Scan this QR code to access your short URL</p>
          <div class="form-group mt-4">
            <input type="text" class="input text-center" value="${url}" readonly>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary modal-close">Close</button>
          <a href="${qrApiUrl}" download="qrcode.png" class="btn btn-primary">Download</a>
        </div>
      </div>
    `;
    
    UI.showModal('qrModal');
  },

  // Reset form and hide result
  resetForm() {
    const form = document.getElementById('shortenForm');
    const result = document.getElementById('result');
    
    if (form) form.reset();
    if (result) result.style.display = 'none';
    
    // Focus on URL input
    const urlInput = document.getElementById('originalUrl');
    if (urlInput) urlInput.focus();
  },

  // Truncate long URLs for display
  truncateURL(url, maxLength = 50) {
    if (url.length <= maxLength) return url;
    return url.substring(0, maxLength - 3) + '...';
  },

  // Load saved session
  loadSavedSession() {
    const token = localStorage.getItem('authToken');
    if (token) {
      AppState.authToken = token;
      this.loadUserData();
    }
  },

  // Load user data
  async loadUserData() {
    try {
      const response = await API.getProfile();
      if (response.success) {
        AppState.currentUser = response.data;
        this.updateUIForLoggedInUser();
      }
    } catch (error) {
      // Token might be expired, remove it
      localStorage.removeItem('authToken');
      AppState.authToken = null;
      console.log('Session expired or invalid');
    }
  },

  // Update UI for logged in user
  updateUIForLoggedInUser() {
    // Update navigation, show user-specific features
    const userElements = document.querySelectorAll('.user-only');
    userElements.forEach(el => el.style.display = 'block');
    
    const guestElements = document.querySelectorAll('.guest-only');
    guestElements.forEach(el => el.style.display = 'none');
  }
};

// Authentication Module
const Auth = {
  // Show login modal
  showLogin() {
    UI.showModal('loginModal');
  },

  // Show register modal
  showRegister() {
    UI.showModal('registerModal');
  },

  // Handle login
  async login(email, password) {
    try {
      const response = await API.login(email, password);
      
      if (response.success) {
        AppState.authToken = response.token;
        AppState.currentUser = response.user;
        
        localStorage.setItem('authToken', response.token);
        
        UI.hideModal('loginModal');
        UI.showAlert('Login successful!', 'success');
        URLShortener.updateUIForLoggedInUser();
        
        return true;
      }
    } catch (error) {
      UI.showAlert(error.message || 'Login failed', 'error');
      return false;
    }
  },

  // Handle registration
  async register(email, password, confirmPassword) {
    if (password !== confirmPassword) {
      UI.showAlert('Passwords do not match', 'error');
      return false;
    }

    try {
      const response = await API.register(email, password);
      
      if (response.success) {
        AppState.authToken = response.token;
        AppState.currentUser = response.user;
        
        localStorage.setItem('authToken', response.token);
        
        UI.hideModal('registerModal');
        UI.showAlert('Registration successful!', 'success');
        URLShortener.updateUIForLoggedInUser();
        
        return true;
      }
    } catch (error) {
      UI.showAlert(error.message || 'Registration failed', 'error');
      return false;
    }
  },

  // Logout
  logout() {
    AppState.authToken = null;
    AppState.currentUser = null;
    
    localStorage.removeItem('authToken');
    
    // Update UI
    const userElements = document.querySelectorAll('.user-only');
    userElements.forEach(el => el.style.display = 'none');
    
    const guestElements = document.querySelectorAll('.guest-only');
    guestElements.forEach(el => el.style.display = 'block');
    
    UI.showAlert('Logged out successfully', 'success');
  }
};

// Analytics Module
const Analytics = {
  // Track click event
  trackClick(shortCode) {
    // This would be called when someone clicks a short URL
    // The backend handles the actual tracking
    console.log('Click tracked for:', shortCode);
  },

  // Get analytics data
  async getAnalytics(shortCode) {
    try {
      const response = await API.getPublicStats(shortCode);
      return response.data;
    } catch (error) {
      console.error('Analytics error:', error);
      return null;
    }
  }
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 LinkShort Application Starting...');
  
  // Initialize URL Shortener
  URLShortener.init();
  
  // Initialize navigation
  initializeNavigation();
  
  // Initialize forms
  initializeForms();
  
  console.log('✅ LinkShort Application Ready');
});

// Navigation initialization
function initializeNavigation() {
  // Mobile menu toggle
  const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
  const navigation = document.querySelector('.navigation');
  
  if (mobileMenuBtn && navigation) {
    mobileMenuBtn.addEventListener('click', () => {
      navigation.classList.toggle('active');
      mobileMenuBtn.classList.toggle('active');
    });
  }

  // Smooth scrolling for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
}

// Forms initialization
function initializeForms() {
  // Login form
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const email = formData.get('email');
      const password = formData.get('password');
      
      await Auth.login(email, password);
    });
  }

  // Register form
  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const email = formData.get('email');
      const password = formData.get('password');
      const confirmPassword = formData.get('confirm_password');
      
      await Auth.register(email, password, confirmPassword);
    });
  }
}

// Global error handler
window.addEventListener('error', (e) => {
  console.error('Global error:', e.error);
  UI.showAlert('Something went wrong. Please try again.', 'error');
});

// Global unhandled promise rejection handler
window.addEventListener('unhandledrejection', (e) => {
  console.error('Unhandled promise rejection:', e.reason);
  e.preventDefault();
});

// Export for global access
window.LinkShort = {
  URLShortener,
  Auth,
  Analytics,
  UI,
  API,
  AppState
};