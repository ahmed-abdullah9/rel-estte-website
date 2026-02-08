// URL Shortener Frontend JavaScript
document.addEventListener('DOMContentLoaded', function() {
    const shortenForm = document.getElementById('shortenForm');
    const originalUrlInput = document.getElementById('originalUrl');
    const shortenBtn = document.getElementById('shortenBtn');
    const btnText = document.querySelector('.btn-text');
    const btnLoading = document.querySelector('.btn-loading');
    const resultDiv = document.getElementById('result');
    
    // Elements for displaying results
    const originalUrlDisplay = document.getElementById('originalUrlDisplay');
    const shortUrlDisplay = document.getElementById('shortUrlDisplay');
    const clickCount = document.getElementById('clickCount');
    const createdDate = document.getElementById('createdDate');
    const copyBtn = document.getElementById('copyBtn');
    const qrBtn = document.getElementById('qrBtn');
    const qrModal = document.getElementById('qrModal');
    const closeQrModalBtn = document.getElementById('closeQrModal');
    
    let currentShortUrl = '';

    // Add error message div if it doesn't exist
    let errorDiv = document.getElementById('errorMessage');
    if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.id = 'errorMessage';
        errorDiv.className = 'error-message';
        shortenForm.insertBefore(errorDiv, shortenForm.firstChild);
    }

    // Form submission
    if (shortenForm) {
        shortenForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            let originalUrl = originalUrlInput.value.trim();
            
            // Clear previous errors and results
            hideError();
            hideResult();
            
            if (!originalUrl) {
                showError('Please enter a URL');
                return;
            }

            // Fix URL format if needed - add https:// if no protocol
            if (!originalUrl.match(/^https?:\/\//i)) {
                originalUrl = 'https://' + originalUrl;
                originalUrlInput.value = originalUrl; // Update input field
            }

            // Validate URL format with improved regex
            if (!isValidUrl(originalUrl)) {
                showError('Please enter a valid URL (e.g., https://example.com)');
                return;
            }

            // Show loading state
            showLoading();

            try {
                const response = await fetch('/api/shorten', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ url: originalUrl })
                });

                const data = await response.json();

                if (response.ok) {
                    displayResult(data);
                    loadStats(); // Update homepage stats
                } else {
                    throw new Error(data.error || 'Failed to shorten URL');
                }
            } catch (error) {
                console.error('Error:', error);
                showError(error.message || 'Failed to shorten URL. Please try again.');
            } finally {
                hideLoading();
            }
        });
    }

    // Copy URL functionality
    if (copyBtn) {
        copyBtn.addEventListener('click', async function() {
            try {
                await navigator.clipboard.writeText(currentShortUrl);
                showCopySuccess();
            } catch (error) {
                // Fallback for older browsers
                fallbackCopyTextToClipboard(currentShortUrl);
                showCopySuccess();
            }
        });
    }

    // QR Code functionality
    if (qrBtn) {
        qrBtn.addEventListener('click', function() {
            generateQRCode(currentShortUrl);
            showQRModal();
        });
    }

    // Close QR modal
    if (closeQrModalBtn) {
        closeQrModalBtn.addEventListener('click', hideQRModal);
    }

    if (qrModal) {
        qrModal.addEventListener('click', function(e) {
            if (e.target === qrModal || e.target.classList.contains('modal-overlay')) {
                hideQRModal();
            }
        });
    }

    // Download QR code
    const downloadBtn = document.getElementById('downloadQr');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', function() {
            const canvas = document.querySelector('#qrCodeDisplay canvas');
            if (canvas) {
                const link = document.createElement('a');
                link.download = 'qrcode.png';
                link.href = canvas.toDataURL();
                link.click();
            }
        });
    }

    // Mobile navigation
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', function() {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
    }

    // Functions
    function isValidUrl(string) {
        try {
            // More flexible URL validation
            const urlPattern = /^https?:\/\/(?:[-\w.])+(?:\.[a-zA-Z]{2,})+(?:\/[^?\s]*)?(?:\?[^#\s]*)?(?:#[^\s]*)?$/i;
            
            // First check with regex
            if (!urlPattern.test(string)) {
                return false;
            }
            
            // Then validate with URL constructor
            const url = new URL(string);
            return url.protocol === 'http:' || url.protocol === 'https:';
        } catch (_) {
            return false;
        }
    }

    function showLoading() {
        if (shortenBtn) {
            shortenBtn.disabled = true;
            if (btnText) btnText.style.display = 'none';
            if (btnLoading) btnLoading.style.display = 'inline-block';
        }
    }

    function hideLoading() {
        if (shortenBtn) {
            shortenBtn.disabled = false;
            if (btnText) btnText.style.display = 'inline-block';
            if (btnLoading) btnLoading.style.display = 'none';
        }
    }

    function showError(message) {
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
            // Scroll error into view
            errorDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    function hideError() {
        if (errorDiv) {
            errorDiv.style.display = 'none';
        }
    }

    function hideResult() {
        if (resultDiv) {
            resultDiv.style.display = 'none';
        }
    }

    function displayResult(data) {
        if (!data.shortUrl || !data.originalUrl) {
            showError('Invalid response from server');
            return;
        }

        currentShortUrl = data.shortUrl;
        
        if (originalUrlDisplay) originalUrlDisplay.textContent = data.originalUrl;
        if (shortUrlDisplay) {
            shortUrlDisplay.textContent = data.shortUrl;
            shortUrlDisplay.href = data.shortUrl;
        }
        if (clickCount) clickCount.textContent = data.clicks || 0;
        if (createdDate) {
            const date = new Date(data.createdAt);
            createdDate.textContent = date.toLocaleDateString();
        }
        
        if (resultDiv) {
            resultDiv.style.display = 'block';
            resultDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    function showCopySuccess() {
        if (copyBtn) {
            const originalHTML = copyBtn.innerHTML;
            copyBtn.innerHTML = '<i class="fas fa-check"></i>';
            copyBtn.classList.add('copied');
            
            setTimeout(() => {
                copyBtn.innerHTML = originalHTML;
                copyBtn.classList.remove('copied');
            }, 2000);
        }
    }

    function fallbackCopyTextToClipboard(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
    }

    function generateQRCode(url) {
        const qrContainer = document.getElementById('qrCodeDisplay');
        const qrUrl = document.getElementById('qrUrlDisplay');
        
        if (qrContainer) {
            qrContainer.innerHTML = '';
            
            if (typeof QRCode !== 'undefined') {
                QRCode.toCanvas(qrContainer, url, {
                    width: 200,
                    height: 200,
                    color: {
                        dark: '#000000',
                        light: '#ffffff'
                    }
                }, function(error) {
                    if (error) {
                        console.error('QR Code generation error:', error);
                        qrContainer.innerHTML = '<p>Error generating QR code</p>';
                    }
                });
            } else {
                qrContainer.innerHTML = '<p>QR Code library not loaded</p>';
            }
        }
        
        if (qrUrl) qrUrl.textContent = url;
    }

    function showQRModal() {
        if (qrModal) {
            qrModal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    }

    function hideQRModal() {
        if (qrModal) {
            qrModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }

    // Load homepage statistics
    async function loadStats() {
        try {
            const response = await fetch('/api/stats/global');
            
            if (response.ok) {
                const data = await response.json();
                
                // Update stats on homepage
                const totalUrlsEl = document.getElementById('totalUrls');
                const totalClicksEl = document.getElementById('totalClicks');
                
                if (totalUrlsEl && data.totalUrls !== undefined) {
                    animateNumber(totalUrlsEl, data.totalUrls);
                }
                if (totalClicksEl && data.totalClicks !== undefined) {
                    animateNumber(totalClicksEl, data.totalClicks);
                }
            } else {
                // Set default values if stats can't be loaded
                const totalUrlsEl = document.getElementById('totalUrls');
                const totalClicksEl = document.getElementById('totalClicks');
                if (totalUrlsEl) totalUrlsEl.textContent = '1,245';
                if (totalClicksEl) totalClicksEl.textContent = '15,678';
            }
        } catch (error) {
            console.error('Failed to load stats:', error);
            // Set default values if stats can't be loaded
            const totalUrlsEl = document.getElementById('totalUrls');
            const totalClicksEl = document.getElementById('totalClicks');
            if (totalUrlsEl) totalUrlsEl.textContent = '1,245';
            if (totalClicksEl) totalClicksEl.textContent = '15,678';
        }
    }

    function animateNumber(element, target) {
        const start = 0;
        const duration = 2000;
        const startTime = performance.now();

        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const current = Math.floor(progress * target);
            element.textContent = current.toLocaleString();

            if (progress < 1) {
                requestAnimationFrame(update);
            }
        }

        requestAnimationFrame(update);
    }

    // Auto-fix URL input on blur
    if (originalUrlInput) {
        originalUrlInput.addEventListener('blur', function() {
            let value = this.value.trim();
            if (value && !value.match(/^https?:\/\//i)) {
                this.value = 'https://' + value;
            }
        });

        // Also fix on enter key
        originalUrlInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                shortenForm.dispatchEvent(new Event('submit'));
            }
        });
    }

    // Load initial stats
    loadStats();
});