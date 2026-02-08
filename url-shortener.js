// URL Shortener Frontend JavaScript
document.addEventListener('DOMContentLoaded', function() {
    const shortenForm = document.getElementById('shortenForm');
    const originalUrlInput = document.getElementById('originalUrl');
    const shortenBtn = document.querySelector('.shorten-btn');
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
    
    let currentShortUrl = '';

    // Form submission
    shortenForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const originalUrl = originalUrlInput.value.trim();
        
        if (!originalUrl) {
            alert('Please enter a URL');
            return;
        }

        // Validate URL format
        if (!isValidUrl(originalUrl)) {
            alert('Please enter a valid URL starting with http:// or https://');
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
            alert(error.message || 'Failed to shorten URL. Please try again.');
        } finally {
            hideLoading();
        }
    });

    // Copy URL functionality
    copyBtn.addEventListener('click', async function() {
        try {
            await navigator.clipboard.writeText(currentShortUrl);
            copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
            copyBtn.classList.add('copied');
            
            setTimeout(() => {
                copyBtn.innerHTML = '<i class="fas fa-copy"></i> Copy';
                copyBtn.classList.remove('copied');
            }, 2000);
        } catch (error) {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = currentShortUrl;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            
            copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
            copyBtn.classList.add('copied');
            
            setTimeout(() => {
                copyBtn.innerHTML = '<i class="fas fa-copy"></i> Copy';
                copyBtn.classList.remove('copied');
            }, 2000);
        }
    });

    // QR Code functionality
    qrBtn.addEventListener('click', function() {
        generateQRCode(currentShortUrl);
        showQRModal();
    });

    // Close QR modal
    document.querySelector('.modal-close').addEventListener('click', hideQRModal);
    qrModal.addEventListener('click', function(e) {
        if (e.target === qrModal) {
            hideQRModal();
        }
    });

    // Functions
    function isValidUrl(string) {
        try {
            new URL(string);
            return string.startsWith('http://') || string.startsWith('https://');
        } catch (_) {
            return false;
        }
    }

    function showLoading() {
        shortenBtn.disabled = true;
        btnText.style.display = 'none';
        btnLoading.style.display = 'inline-block';
    }

    function hideLoading() {
        shortenBtn.disabled = false;
        btnText.style.display = 'inline-block';
        btnLoading.style.display = 'none';
    }

    function displayResult(data) {
        currentShortUrl = data.shortUrl;
        
        originalUrlDisplay.textContent = data.originalUrl;
        shortUrlDisplay.textContent = data.shortUrl;
        shortUrlDisplay.href = data.shortUrl;
        clickCount.textContent = data.clicks;
        createdDate.textContent = new Date(data.createdAt).toLocaleDateString();
        
        resultDiv.style.display = 'block';
        resultDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    function generateQRCode(url) {
        const qrContainer = document.getElementById('qrCode');
        const qrUrl = document.getElementById('qrUrl');
        
        qrContainer.innerHTML = '';
        qrUrl.textContent = url;
        
        QRCode.toCanvas(qrContainer, url, {
            width: 200,
            height: 200,
            color: {
                dark: '#000000',
                light: '#ffffff'
            }
        });
    }

    function showQRModal() {
        qrModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    function hideQRModal() {
        qrModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    // Download QR code
    document.getElementById('downloadQr').addEventListener('click', function() {
        const canvas = document.querySelector('#qrCode canvas');
        if (canvas) {
            const link = document.createElement('a');
            link.download = 'qrcode.png';
            link.href = canvas.toDataURL();
            link.click();
        }
    });

    // Load homepage statistics
    async function loadStats() {
        try {
            const response = await fetch('/api/stats/global');
            if (response.ok) {
                const stats = await response.json();
                
                // Update stats on homepage
                const totalUrlsEl = document.getElementById('totalUrls');
                const totalClicksEl = document.getElementById('totalClicks');
                
                if (totalUrlsEl) {
                    animateNumber(totalUrlsEl, stats.totalUrls || 0);
                }
                if (totalClicksEl) {
                    animateNumber(totalClicksEl, stats.totalClicks || 0);
                }
            }
        } catch (error) {
            console.error('Failed to load stats:', error);
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

    // Load initial stats
    loadStats();
});