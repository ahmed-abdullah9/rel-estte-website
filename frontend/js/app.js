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
    console.log('DOM loaded, initializing URL shortener...');
    
    const shortenForm = document.getElementById('shortenForm');
    const originalUrlInput = document.getElementById('originalUrl');
    const customCodeInput = document.getElementById('customCode');
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
            errorDiv.classList.add('show');
            setTimeout(() => errorDiv.classList.remove('show'), 5000);
        }
    }

    function hideError() {
        if (errorDiv) {
            errorDiv.classList.remove('show');
        }
    }

    function showResult(data) {
        if (resultDiv) {
            originalUrlDisplay.textContent = data.original_url;
            shortUrlDisplay.textContent = data.short_url;
            shortUrlDisplay.href = data.short_url;
            clickCount.textContent = data.click_count || 0;
            createdDate.textContent = new Date(data.created_at).toLocaleDateString();
            
            currentShortUrl = data.short_url;
            resultDiv.classList.add('show');
        }
    }

    function hideResult() {
        if (resultDiv) {
            resultDiv.classList.remove('show');
        }
    }

    function setLoading(loading) {
        if (shortenBtn) {
            shortenBtn.disabled = loading;
            if (btnText) btnText.style.display = loading ? 'none' : 'flex';
            if (btnLoading) btnLoading.style.display = loading ? 'flex' : 'none';
        }
    }

    // Form submission
    if (shortenForm) {
        shortenForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const originalUrl = originalUrlInput.value.trim();
            const customCode = customCodeInput.value.trim();
            
            if (!originalUrl) {
                showError('Please enter a URL');
                return;
            }

            hideError();
            hideResult();
            setLoading(true);

            try {
                const response = await fetch('/api/urls/shorten', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        url: originalUrl,
                        customCode: customCode || undefined
                    })
                });

                const data = await response.json();

                if (data.success) {
                    showResult(data.data);
                } else {
                    showError(data.message || 'Error creating short URL');
                }
            } catch (error) {
                console.error('Error:', error);
                showError('Network error. Please try again.');
            } finally {
                setLoading(false);
            }
        });
    }

    // Copy button
    if (copyBtn) {
        copyBtn.addEventListener('click', async () => {
            if (currentShortUrl) {
                try {
                    await navigator.clipboard.writeText(currentShortUrl);
                    copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
                    copyBtn.classList.add('btn-success');
                    
                    setTimeout(() => {
                        copyBtn.innerHTML = '<i class="fas fa-copy"></i> Copy Link';
                        copyBtn.classList.remove('btn-success');
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
                    
                    copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
                    copyBtn.classList.add('btn-success');
                    
                    setTimeout(() => {
                        copyBtn.innerHTML = '<i class="fas fa-copy"></i> Copy Link';
                        copyBtn.classList.remove('btn-success');
                    }, 2000);
                }
            }
        });
    }

    // QR Code button
    if (qrBtn) {
        qrBtn.addEventListener('click', () => {
            if (currentShortUrl && qrModal) {
                const qrCodeImage = document.getElementById('qrCodeImage');
                if (qrCodeImage) {
                    // Use QR Server API
                    qrCodeImage.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(currentShortUrl)}`;
                }
                qrModal.classList.add('show');
            }
        });
    }

    // Close QR modal
    if (closeQrModalBtn && qrModal) {
        closeQrModalBtn.addEventListener('click', () => {
            qrModal.classList.remove('show');
        });

        qrModal.addEventListener('click', (e) => {
            if (e.target === qrModal) {
                qrModal.classList.remove('show');
            }
        });
    }

    console.log('✅ URL shortener initialized');
});