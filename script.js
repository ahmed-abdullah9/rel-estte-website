// Mobile Navigation
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');
const navLinks = document.querySelectorAll('.nav-link');

if (hamburger) {
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    });
}

if (navLinks) {
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (hamburger) hamburger.classList.remove('active');
            if (navMenu) navMenu.classList.remove('active');
        });
    });
}

// Header scroll effect
window.addEventListener('scroll', () => {
    const header = document.querySelector('.header');
    if (header) {
        if (window.scrollY > 100) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    }
});

// Smooth scrolling for navigation links
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

// URL Shortener Functionality
document.addEventListener('DOMContentLoaded', function() {
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
    const qrBtn = document.getElementById('qrBtn');
    const qrModal = document.getElementById('qrModal');
    const closeQrModalBtn = document.getElementById('closeQrModal');
    
    let currentShortUrl = '';

    // Helper functions
    function showError(message) {
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
        }
    }

    function hideError() {
        if (errorDiv) {
            errorDiv.style.display = 'none';
        }
    }

    function showResult() {
        if (resultDiv) {
            resultDiv.style.display = 'block';
        }
    }

    function hideResult() {
        if (resultDiv) {
            resultDiv.style.display = 'none';
        }
    }

    function setLoading(isLoading) {
        if (shortenBtn && btnText && btnLoading) {
            shortenBtn.disabled = isLoading;
            if (isLoading) {
                btnText.style.display = 'none';
                btnLoading.style.display = 'inline-flex';
            } else {
                btnText.style.display = 'inline';
                btnLoading.style.display = 'none';
            }
        }
    }

    function isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }

    function formatUrl(url) {
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            return 'https://' + url;
        }
        return url;
    }

    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
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

            // Format URL if needed
            originalUrl = formatUrl(originalUrl);

            // Validate URL
            if (!isValidUrl(originalUrl)) {
                showError('Please enter a valid URL');
                return;
            }

            setLoading(true);

            try {
                const response = await fetch('/api/shorten', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ url: originalUrl })
                });

                const data = await response.json();

                if (data.success && data.data) {
                    // Display results
                    if (originalUrlDisplay) {
                        originalUrlDisplay.textContent = data.data.original_url;
                    }
                    if (shortUrlDisplay) {
                        shortUrlDisplay.textContent = data.data.short_url;
                        currentShortUrl = data.data.short_url;
                    }
                    if (clickCount) {
                        clickCount.textContent = data.data.clicks || 0;
                    }
                    if (createdDate) {
                        createdDate.textContent = formatDate(data.data.created_at);
                    }

                    showResult();
                    
                    // Clear input
                    originalUrlInput.value = '';
                } else {
                    showError(data.message || 'Failed to shorten URL');
                }

            } catch (error) {
                console.error('Shorten error:', error);
                showError('Network error. Please try again.');
            } finally {
                setLoading(false);
            }
        });
    }

    // Copy to clipboard functionality
    if (copyBtn) {
        copyBtn.addEventListener('click', async function() {
            if (currentShortUrl) {
                try {
                    await navigator.clipboard.writeText(currentShortUrl);
                    
                    // Visual feedback
                    const originalIcon = this.innerHTML;
                    this.innerHTML = '<i class="fas fa-check"></i>';
                    this.style.background = '#48bb78';
                    this.style.borderColor = '#48bb78';
                    this.style.color = 'white';
                    
                    setTimeout(() => {
                        this.innerHTML = originalIcon;
                        this.style.background = 'none';
                        this.style.borderColor = 'var(--primary)';
                        this.style.color = 'var(--primary)';
                    }, 2000);
                    
                } catch (err) {
                    // Fallback for older browsers
                    const textArea = document.createElement('textarea');
                    textArea.value = currentShortUrl;
                    document.body.appendChild(textArea);
                    textArea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textArea);
                    
                    showError('URL copied to clipboard!');
                }
            }
        });
    }

    // QR Code functionality
    if (qrBtn && window.QRCode) {
        qrBtn.addEventListener('click', function() {
            if (currentShortUrl && qrModal) {
                // Clear previous QR code
                const qrcodeDiv = document.getElementById('qrcode');
                if (qrcodeDiv) {
                    qrcodeDiv.innerHTML = '';
                    
                    // Generate new QR code
                    QRCode.toCanvas(qrcodeDiv, currentShortUrl, {
                        width: 200,
                        margin: 2,
                        color: {
                            dark: '#000000',
                            light: '#FFFFFF'
                        }
                    }, function (error) {
                        if (error) {
                            console.error('QR Code error:', error);
                            qrcodeDiv.innerHTML = '<p>Failed to generate QR code</p>';
                        }
                    });
                }
                
                qrModal.style.display = 'flex';
            }
        });
    }

    // Close QR modal
    if (closeQrModalBtn && qrModal) {
        closeQrModalBtn.addEventListener('click', function() {
            qrModal.style.display = 'none';
        });

        // Close on background click
        qrModal.addEventListener('click', function(e) {
            if (e.target === qrModal) {
                qrModal.style.display = 'none';
            }
        });
    }

    // Download QR code
    const downloadQrBtn = document.getElementById('downloadQr');
    if (downloadQrBtn) {
        downloadQrBtn.addEventListener('click', function() {
            const canvas = document.querySelector('#qrcode canvas');
            if (canvas) {
                const link = document.createElement('a');
                link.download = 'qrcode.png';
                link.href = canvas.toDataURL();
                link.click();
            }
        });
    }
});

// Active navigation highlighting
window.addEventListener('scroll', () => {
    let current = '';
    const sections = document.querySelectorAll('section');
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (pageYOffset >= (sectionTop - 200)) {
            current = section.getAttribute('id');
        }
    });

    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
});