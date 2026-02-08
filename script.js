// Mobile Navigation
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');
const navLinks = document.querySelectorAll('.nav-link');

hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
});

navLinks.forEach(link => {
    link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
    });
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

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
});

// Header background on scroll
window.addEventListener('scroll', () => {
    const header = document.querySelector('.header');
    if (window.scrollY > 100) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
});

// Property filter functionality
const filterButtons = document.querySelectorAll('.filter-btn');
const propertyCards = document.querySelectorAll('.property-card');

filterButtons.forEach(button => {
    button.addEventListener('click', () => {
        // Remove active class from all buttons
        filterButtons.forEach(btn => btn.classList.remove('active'));
        // Add active class to clicked button
        button.classList.add('active');

        const filterValue = button.getAttribute('data-filter');
        
        propertyCards.forEach(card => {
            if (filterValue === 'all' || card.getAttribute('data-category') === filterValue) {
                card.style.display = 'block';
                card.classList.add('fade-in');
            } else {
                card.style.display = 'none';
            }
        });
    });
});

// Contact form submission
const contactForm = document.querySelector('.contact-form form');
if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(contactForm);
        const data = {
            name: formData.get('name') || document.querySelector('input[placeholder="الاسم الكامل"]').value,
            email: formData.get('email') || document.querySelector('input[placeholder="البريد الإلكتروني"]').value,
            phone: formData.get('phone') || document.querySelector('input[placeholder="رقم الهاتف"]').value,
            inquiry_type: formData.get('inquiry_type') || document.querySelector('select').value,
            message: formData.get('message') || document.querySelector('textarea').value
        };

        try {
            const response = await fetch('/api/inquiries', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                alert('تم إرسال رسالتك بنجاح!');
                contactForm.reset();
            } else {
                alert('حدث خطأ في إرسال الرسالة. يرجى المحاولة مرة أخرى.');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('حدث خطأ في إرسال الرسالة. يرجى المحاولة مرة أخرى.');
        }
    });
}

// Load properties from API
async function loadProperties() {
    try {
        const response = await fetch('/api/properties');
        const properties = await response.json();
        
        const propertiesGrid = document.querySelector('.properties-grid');
        if (propertiesGrid && properties.length > 0) {
            // Clear existing properties except the first 4 (static ones)
            const existingCards = propertiesGrid.querySelectorAll('.property-card');
            if (existingCards.length > 4) {
                for (let i = 4; i < existingCards.length; i++) {
                    existingCards[i].remove();
                }
            }
            
            // Add new properties from database
            properties.slice(0, 8).forEach((property, index) => {
                if (index >= 4) { // Only add if we need more than the static 4
                    const propertyCard = createPropertyCard(property);
                    propertiesGrid.appendChild(propertyCard);
                }
            });
        }
    } catch (error) {
        console.error('Error loading properties:', error);
    }
}

// Create property card HTML
function createPropertyCard(property) {
    const card = document.createElement('div');
    card.className = 'property-card';
    card.setAttribute('data-category', property.property_type);
    
    const features = property.features ? property.features.split('\n').filter(f => f.trim()) : [];
    const featuresHTML = features.map(feature => `<span><i class="fas fa-check"></i> ${feature}</span>`).join('');
    
    card.innerHTML = `
        <div class="property-image">
            ${property.image_url ? 
                `<img src="${property.image_url}" alt="${property.title}">` : 
                `<div class="img-placeholder"><i class="fas fa-home"></i></div>`
            }
            <div class="property-badge ${property.status === 'for_rent' ? 'rent' : ''}">${property.status === 'for_rent' ? 'للإيجار' : 'للبيع'}</div>
        </div>
        <div class="property-info">
            <h3>${property.title}</h3>
            <p class="property-location"><i class="fas fa-map-marker-alt"></i> ${property.location}</p>
            <div class="property-features">
                ${property.bedrooms ? `<span><i class="fas fa-bed"></i> ${property.bedrooms} غرف</span>` : ''}
                ${property.bathrooms ? `<span><i class="fas fa-bath"></i> ${property.bathrooms} حمامات</span>` : ''}
                ${property.area ? `<span><i class="fas fa-ruler-combined"></i> ${property.area} م²</span>` : ''}
            </div>
            ${featuresHTML ? `<div class="property-extra-features">${featuresHTML}</div>` : ''}
            <div class="property-price">${Number(property.price).toLocaleString('ar-SA')} ريال${property.status === 'for_rent' ? '/شهر' : ''}</div>
        </div>
    `;
    
    return card;
}

// Property search functionality
const searchForm = document.querySelector('.hero-search form, .search-form');
if (searchForm) {
    searchForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(searchForm);
        const searchParams = new URLSearchParams();
        
        // Add search parameters
        if (formData.get('property_type')) searchParams.append('type', formData.get('property_type'));
        if (formData.get('location')) searchParams.append('location', formData.get('location'));
        if (formData.get('max_price')) searchParams.append('max_price', formData.get('max_price'));
        
        try {
            const response = await fetch(`/api/properties?${searchParams.toString()}`);
            const properties = await response.json();
            
            // Update properties display
            const propertiesGrid = document.querySelector('.properties-grid');
            if (propertiesGrid) {
                propertiesGrid.innerHTML = '';
                properties.forEach(property => {
                    const propertyCard = createPropertyCard(property);
                    propertiesGrid.appendChild(propertyCard);
                });
                
                // Scroll to properties section
                document.getElementById('properties').scrollIntoView({ behavior: 'smooth' });
            }
        } catch (error) {
            console.error('Error searching properties:', error);
        }
    });
}

// Animate elements on scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('fade-in-up');
        }
    });
}, observerOptions);

// Observe elements for animation
document.addEventListener('DOMContentLoaded', () => {
    const animatedElements = document.querySelectorAll('.property-card, .service-card, .stat-item, .about-text, .contact-item');
    animatedElements.forEach(el => observer.observe(el));
    
    // Load properties from API
    loadProperties();
});

// Counter animation for statistics
function animateCounters() {
    const counters = document.querySelectorAll('.stat-number');
    
    counters.forEach(counter => {
        const target = parseInt(counter.innerText.replace(/\D/g, ''));
        const duration = 2000;
        const start = performance.now();
        
        const updateCounter = (currentTime) => {
            const elapsed = currentTime - start;
            const progress = Math.min(elapsed / duration, 1);
            
            const current = Math.floor(progress * target);
            const suffix = counter.innerText.includes('+') ? '+' : '';
            counter.innerText = current.toLocaleString('ar-SA') + suffix;
            
            if (progress < 1) {
                requestAnimationFrame(updateCounter);
            }
        };
        
        requestAnimationFrame(updateCounter);
    });
}

// Trigger counter animation when stats section is visible
const statsSection = document.querySelector('.stats');
if (statsSection) {
    const statsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounters();
                statsObserver.unobserve(entry.target);
            }
        });
    });
    
    statsObserver.observe(statsSection);
}

// Property card hover effects
document.addEventListener('mouseover', (e) => {
    if (e.target.closest('.property-card')) {
        e.target.closest('.property-card').style.transform = 'translateY(-5px)';
    }
});

document.addEventListener('mouseout', (e) => {
    if (e.target.closest('.property-card')) {
        e.target.closest('.property-card').style.transform = 'translateY(0)';
    }
});

// Lazy loading for images
document.addEventListener('DOMContentLoaded', () => {
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
                    imageObserver.unobserve(img);
                }
            });
        });

        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    }
});

// Add loading states
function showLoading(element) {
    element.classList.add('loading');
    element.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري التحميل...';
}

function hideLoading(element, originalContent) {
    element.classList.remove('loading');
    element.innerHTML = originalContent;
}

// Add to favorites functionality (if needed)
function toggleFavorite(propertyId) {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    const index = favorites.indexOf(propertyId);
    
    if (index > -1) {
        favorites.splice(index, 1);
    } else {
        favorites.push(propertyId);
    }
    
    localStorage.setItem('favorites', JSON.stringify(favorites));
    updateFavoriteButtons();
}

function updateFavoriteButtons() {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    document.querySelectorAll('[data-property-id]').forEach(button => {
        const propertyId = parseInt(button.dataset.propertyId);
        if (favorites.includes(propertyId)) {
            button.classList.add('favorited');
            button.innerHTML = '<i class="fas fa-heart"></i>';
        } else {
            button.classList.remove('favorited');
            button.innerHTML = '<i class="far fa-heart"></i>';
        }
    });
}

// Initialize favorite buttons on page load
document.addEventListener('DOMContentLoaded', updateFavoriteButtons);