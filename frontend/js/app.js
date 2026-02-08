document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 LinkShort App Initializing...');
  
  // Elements
  const shortenForm = document.getElementById('shortenForm');
  const originalUrlInput = document.getElementById('originalUrl');
  const shortenBtn = document.getElementById('shortenBtn');
  const btnText = document.querySelector('.btn-text');
  const btnLoading = document.querySelector('.btn-loading');
  const resultDiv = document.getElementById('result');
  const errorDiv = document.getElementById('errorMessage');
  
  // Result elements
  const originalUrlDisplay = document.getElementById('originalUrlDisplay');
  const shortUrlDisplay = document.getElementById('shortUrlDisplay');
  const clickCount = document.getElementById('clickCount');
  const createdDate = document.getElementById('createdDate');
  const copyBtn = document.getElementById('copyBtn');
  const newUrlBtn = document.getElementById('newUrlBtn');
  
  let currentShortUrl = '';

  // Form submission
  if (shortenForm) {
    shortenForm.addEventListener('submit', handleShortenSubmit);
  }

  // Copy button
  if (copyBtn) {
    copyBtn.addEventListener('click', copyToClipboard);
  }

  // New URL button
  if (newUrlBtn) {
    newUrlBtn.addEventListener('click', resetForm);
  }

  async function handleShortenSubmit(e) {
    e.preventDefault();
    
    const url = originalUrlInput.value.trim();
    
    if (!url) {
      showError('Please enter a URL');
      return;
    }

    if (!isValidURL(url)) {
      showError('Please enter a valid URL (must start with http:// or https://)');
      return;
    }

    try {
      setLoading(true);
      hideError();
      
      console.log('📝 Sending shorten request:', { url });
      
      const response = await urlService.shorten(url);
      
      console.log('✅ Shorten response:', response);
      
      if (response.success) {
        displayResult(response.data);
      } else {
        showError(response.message || 'Failed to shorten URL');
      }
      
    } catch (error) {
      console.error('❌ Shorten error:', error);
      showError(error.message || 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function displayResult(data) {
    currentShortUrl = data.short_url;
    
    // Update display elements
    if (originalUrlDisplay) originalUrlDisplay.textContent = data.original_url;
    if (shortUrlDisplay) shortUrlDisplay.textContent = data.short_url;
    if (clickCount) clickCount.textContent = data.click_count || 0;
    if (createdDate) createdDate.textContent = new Date(data.created_at).toLocaleDateString();
    
    // Show result, hide form
    if (resultDiv) resultDiv.style.display = 'block';
    if (shortenForm) shortenForm.style.display = 'none';
    
    // Animate in
    setTimeout(() => {
      if (resultDiv) resultDiv.classList.add('show');
    }, 100);
  }

  function resetForm() {
    if (originalUrlInput) originalUrlInput.value = '';
    if (resultDiv) resultDiv.style.display = 'none';
    if (shortenForm) shortenForm.style.display = 'block';
    hideError();
    currentShortUrl = '';
  }

  async function copyToClipboard() {
    if (!currentShortUrl) return;
    
    try {
      await navigator.clipboard.writeText(currentShortUrl);
      
      // Visual feedback
      const originalText = copyBtn.innerHTML;
      copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
      copyBtn.classList.add('success');
      
      setTimeout(() => {
        copyBtn.innerHTML = originalText;
        copyBtn.classList.remove('success');
      }, 2000);
      
    } catch (error) {
      console.error('Copy failed:', error);
      
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = currentShortUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      showSuccess('Link copied to clipboard!');
    }
  }

  function setLoading(loading) {
    if (shortenBtn) {
      shortenBtn.disabled = loading;
    }
    
    if (btnText) {
      btnText.style.display = loading ? 'none' : 'flex';
    }
    
    if (btnLoading) {
      btnLoading.style.display = loading ? 'flex' : 'none';
    }
  }

  function showError(message) {
    if (errorDiv) {
      errorDiv.textContent = message;
      errorDiv.style.display = 'block';
      errorDiv.classList.add('shake');
      
      setTimeout(() => {
        if (errorDiv) errorDiv.classList.remove('shake');
      }, 500);
    }
  }

  function hideError() {
    if (errorDiv) {
      errorDiv.style.display = 'none';
    }
  }

  function showSuccess(message) {
    // Create temporary success message
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    successDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #10b981;
      color: white;
      padding: 12px 24px;
      border-radius: 6px;
      z-index: 1000;
      animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
      successDiv.remove();
    }, 3000);
  }

  function isValidURL(string) {
    try {
      new URL(string);
      return string.startsWith('http://') || string.startsWith('https://');
    } catch (_) {
      return false;
    }
  }

  // Load initial stats
  loadPlatformStats();
  
  async function loadPlatformStats() {
    try {
      // Mock stats for now - can be replaced with real API call
      const stats = {
        totalUrls: Math.floor(Math.random() * 10000) + 5000,
        totalClicks: Math.floor(Math.random() * 50000) + 25000,
        todayUrls: Math.floor(Math.random() * 100) + 50,
        activeUsers: Math.floor(Math.random() * 1000) + 500
      };
      
      if (document.getElementById('totalUrls')) {
        document.getElementById('totalUrls').textContent = stats.totalUrls.toLocaleString();
      }
      if (document.getElementById('totalClicks')) {
        document.getElementById('totalClicks').textContent = stats.totalClicks.toLocaleString();
      }
      if (document.getElementById('todayUrls')) {
        document.getElementById('todayUrls').textContent = stats.todayUrls.toLocaleString();
      }
      if (document.getElementById('activeUsers')) {
        document.getElementById('activeUsers').textContent = stats.activeUsers.toLocaleString();
      }
    } catch (error) {
      console.error('Failed to load platform stats:', error);
    }
  }

  console.log('✅ LinkShort App Initialized');
});

// Mobile navigation
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');

if (hamburger) {
  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navLinks.classList.toggle('active');
  });
}

// Smooth scrolling
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