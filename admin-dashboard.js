// Admin Dashboard JavaScript
let currentUser = null;
let authToken = null;
let clicksChart = null;
let analyticsChart = null;

// Check for existing session on load
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
        window.location.href = '/admin-login.html';
        return;
    }
    
    authToken = token;
    loadDashboardData();
    initializeEventListeners();
});

// Initialize event listeners
function initializeEventListeners() {
    // Logout functionality
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }

    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.dataset.section;
            switchSection(section);
        });
    });

    // Search functionality
    const searchInput = document.getElementById('searchUrls');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(searchUrls, 300));
    }

    // Filter and sort
    const sortBy = document.getElementById('sortBy');
    const filterBy = document.getElementById('filterBy');
    
    if (sortBy) sortBy.addEventListener('change', loadUrls);
    if (filterBy) filterBy.addEventListener('change', loadUrls);

    // Export functionality
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportData);
    }

    // Chart period change
    const chartPeriod = document.getElementById('chartPeriod');
    if (chartPeriod) {
        chartPeriod.addEventListener('change', updateClicksChart);
    }

    // Analytics URL selector
    const analyticsUrl = document.getElementById('analyticsUrl');
    if (analyticsUrl) {
        analyticsUrl.addEventListener('change', loadUrlAnalytics);
    }

    // Date filter
    const applyDateFilter = document.getElementById('applyDateFilter');
    if (applyDateFilter) {
        applyDateFilter.addEventListener('click', applyAnalyticsDateFilter);
    }
}

// Switch between sections
function switchSection(section) {
    // Update navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[data-section="${section}"]`).classList.add('active');

    // Update content
    document.querySelectorAll('.content-section').forEach(sec => {
        sec.classList.remove('active');
    });
    
    const targetSection = document.getElementById(section + 'Section');
    if (targetSection) {
        targetSection.classList.add('active');
    }

    // Update page title
    const pageTitle = document.getElementById('pageTitle');
    if (pageTitle) {
        pageTitle.textContent = section.charAt(0).toUpperCase() + section.slice(1);
    }

    // Load section-specific data
    switch(section) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'urls':
            loadUrls();
            break;
        case 'analytics':
            loadAnalyticsData();
            break;
    }
}

// Load dashboard data
async function loadDashboardData() {
    try {
        const response = await fetch('/api/admin/dashboard', {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 401) {
            logout();
            return;
        }

        const data = await response.json();
        
        if (response.ok) {
            updateDashboardStats(data.stats);
            updateClicksChart(data.clickTrends);
            updateTopUrls(data.topUrls);
            updateRecentActivity(data.recentUrls);
        }
    } catch (error) {
        console.error('Error loading dashboard:', error);
        showNotification('Failed to load dashboard data', 'error');
    }
}

// Update dashboard statistics
function updateDashboardStats(stats) {
    if (!stats) return;

    const totalUrlsCount = document.getElementById('totalUrlsCount');
    const totalClicksCount = document.getElementById('totalClicksCount');
    const todayClicksCount = document.getElementById('todayClicksCount');
    const avgClicksCount = document.getElementById('avgClicksCount');

    if (totalUrlsCount) totalUrlsCount.textContent = stats.totalUrls || 0;
    if (totalClicksCount) totalClicksCount.textContent = (stats.totalClicks || 0).toLocaleString();
    if (todayClicksCount) todayClicksCount.textContent = stats.todayClicks || 0;
    if (avgClicksCount) avgClicksCount.textContent = stats.avgClicks || 0;
}

// Update clicks chart
function updateClicksChart(data) {
    const ctx = document.getElementById('clicksChart');
    if (!ctx) return;

    if (clicksChart) {
        clicksChart.destroy();
    }

    const labels = data ? data.map(item => new Date(item.date).toLocaleDateString()) : [];
    const clicks = data ? data.map(item => item.clicks) : [];

    clicksChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Clicks',
                data: clicks,
                borderColor: '#2563eb',
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Update top URLs list
function updateTopUrls(urls) {
    const container = document.getElementById('topUrlsList');
    if (!container || !urls) return;

    if (urls.length === 0) {
        container.innerHTML = '<p class="no-data">No URLs found</p>';
        return;
    }

    container.innerHTML = urls.map(url => `
        <div class="top-url-item">
            <div class="url-info">
                <div class="url-title">${truncateUrl(url.original_url, 40)}</div>
                <div class="url-code">${window.location.origin}/${url.short_code}</div>
            </div>
            <div class="url-stats">
                <span class="click-count">${url.clicks} clicks</span>
            </div>
        </div>
    `).join('');
}

// Update recent activity
function updateRecentActivity(urls) {
    const container = document.getElementById('recentActivity');
    if (!container || !urls) return;

    if (urls.length === 0) {
        container.innerHTML = '<p class="no-data">No recent activity</p>';
        return;
    }

    container.innerHTML = urls.map(url => `
        <div class="activity-item">
            <div class="activity-icon">
                <i class="fas fa-link"></i>
            </div>
            <div class="activity-info">
                <div class="activity-title">New URL created</div>
                <div class="activity-description">${truncateUrl(url.original_url, 50)}</div>
                <div class="activity-time">${timeAgo(new Date(url.created_at))}</div>
            </div>
            <div class="activity-stats">
                ${url.today_clicks || 0} clicks today
            </div>
        </div>
    `).join('');
}

// Load URLs with filters
async function loadUrls() {
    const sortBy = document.getElementById('sortBy')?.value || 'created_at';
    const filterBy = document.getElementById('filterBy')?.value || 'all';
    const search = document.getElementById('searchUrls')?.value || '';

    try {
        const params = new URLSearchParams({
            sort: sortBy,
            filter: filterBy,
            search: search
        });

        const response = await fetch(`/api/admin/urls?${params}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.status === 401) {
            logout();
            return;
        }

        const data = await response.json();
        
        if (response.ok) {
            displayUrlsTable(data.urls);
            updatePagination(data.pagination);
        }
    } catch (error) {
        console.error('Error loading URLs:', error);
        showNotification('Failed to load URLs', 'error');
    }
}

// Display URLs table
function displayUrlsTable(urls) {
    const tbody = document.getElementById('urlsTableBody');
    if (!tbody) return;

    if (!urls || urls.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="no-data">No URLs found</td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = urls.map(url => `
        <tr>
            <td>
                <div class="short-code">${url.short_code}</div>
                <div class="short-url">${window.location.origin}/${url.short_code}</div>
            </td>
            <td>
                <div class="original-url" title="${url.original_url}">
                    ${truncateUrl(url.original_url, 60)}
                </div>
            </td>
            <td>${new Date(url.created_at).toLocaleDateString()}</td>
            <td>
                <span class="click-badge">${url.clicks}</span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn view-btn" onclick="viewUrlDetails('${url.short_code}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn copy-btn" onclick="copyUrl('${window.location.origin}/${url.short_code}')">
                        <i class="fas fa-copy"></i>
                    </button>
                    <button class="action-btn delete-btn" onclick="deleteUrl(${url.id}, '${url.short_code}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Delete URL
async function deleteUrl(id, shortCode) {
    if (!confirm(`Are you sure you want to delete ${shortCode}? This action cannot be undone.`)) {
        return;
    }

    try {
        const response = await fetch(`/api/admin/urls/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            showNotification('URL deleted successfully', 'success');
            loadUrls();
        } else {
            throw new Error('Failed to delete URL');
        }
    } catch (error) {
        console.error('Error deleting URL:', error);
        showNotification('Failed to delete URL', 'error');
    }
}

// Copy URL to clipboard
async function copyUrl(url) {
    try {
        await navigator.clipboard.writeText(url);
        showNotification('URL copied to clipboard', 'success');
    } catch (error) {
        console.error('Failed to copy URL:', error);
        showNotification('Failed to copy URL', 'error');
    }
}

// Search URLs
function searchUrls() {
    loadUrls();
}

// Export data
async function exportData() {
    try {
        const response = await fetch('/api/admin/export', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `linkshort-data-${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            showNotification('Data exported successfully', 'success');
        }
    } catch (error) {
        console.error('Error exporting data:', error);
        showNotification('Failed to export data', 'error');
    }
}

// Load analytics data
async function loadAnalyticsData() {
    try {
        const response = await fetch('/api/admin/urls', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            populateAnalyticsUrlSelector(data.urls);
        }
    } catch (error) {
        console.error('Error loading analytics data:', error);
    }
}

// Populate analytics URL selector
function populateAnalyticsUrlSelector(urls) {
    const selector = document.getElementById('analyticsUrl');
    if (!selector || !urls) return;

    selector.innerHTML = '<option value="">Choose a URL...</option>' + 
        urls.map(url => `
            <option value="${url.short_code}">
                ${truncateUrl(url.original_url, 50)} (${url.clicks} clicks)
            </option>
        `).join('');
}

// Load URL analytics
async function loadUrlAnalytics() {
    const shortCode = document.getElementById('analyticsUrl')?.value;
    if (!shortCode) {
        document.getElementById('analyticsContent').style.display = 'none';
        document.getElementById('noAnalyticsData').style.display = 'block';
        return;
    }

    try {
        const response = await fetch(`/api/admin/analytics/${shortCode}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            displayUrlAnalytics(data);
        }
    } catch (error) {
        console.error('Error loading URL analytics:', error);
        showNotification('Failed to load analytics', 'error');
    }
}

// Display URL analytics
function displayUrlAnalytics(data) {
    document.getElementById('analyticsContent').style.display = 'block';
    document.getElementById('noAnalyticsData').style.display = 'none';

    // Update summary
    const analyticsClicks = document.getElementById('analyticsClicks');
    const analyticsUnique = document.getElementById('analyticsUnique');
    const analyticsPeak = document.getElementById('analyticsPeak');

    if (analyticsClicks) analyticsClicks.textContent = data.url.clicks || 0;
    if (analyticsUnique) analyticsUnique.textContent = data.analytics.uniqueVisitors || 0;
    
    if (analyticsPeak && data.analytics.dailyStats && data.analytics.dailyStats.length > 0) {
        const peak = data.analytics.dailyStats.reduce((max, day) => 
            day.clicks > max.clicks ? day : max, data.analytics.dailyStats[0]);
        analyticsPeak.textContent = new Date(peak.date).toLocaleDateString();
    }

    // Update analytics chart
    updateAnalyticsChart(data.analytics.dailyStats);
    
    // Update referrers list
    updateReferrersList(data.analytics.referrers);
}

// Update analytics chart
function updateAnalyticsChart(dailyStats) {
    const ctx = document.getElementById('analyticsChart');
    if (!ctx) return;

    if (analyticsChart) {
        analyticsChart.destroy();
    }

    const labels = dailyStats ? dailyStats.map(item => new Date(item.date).toLocaleDateString()) : [];
    const clicks = dailyStats ? dailyStats.map(item => item.clicks) : [];

    analyticsChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Clicks',
                data: clicks,
                backgroundColor: 'rgba(37, 99, 235, 0.8)',
                borderColor: '#2563eb',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Update referrers list
function updateReferrersList(referrers) {
    const container = document.getElementById('referrersList');
    if (!container) return;

    if (!referrers || referrers.length === 0) {
        container.innerHTML = '<p class="no-data">No referrer data available</p>';
        return;
    }

    const total = referrers.reduce((sum, ref) => sum + ref.count, 0);
    
    container.innerHTML = referrers.map(referrer => `
        <div class="referrer-item">
            <div class="referrer-info">
                <div class="referrer-name">${referrer.source}</div>
                <div class="referrer-count">${referrer.count} clicks</div>
            </div>
            <div class="referrer-percentage">
                ${Math.round((referrer.count / total) * 100)}%
            </div>
        </div>
    `).join('');
}

// Logout function
function logout() {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    window.location.href = '/admin-login.html';
}

// Refresh data
function refreshData() {
    const activeSection = document.querySelector('.content-section.active');
    if (!activeSection) return;

    const sectionId = activeSection.id;
    
    if (sectionId.includes('dashboard')) {
        loadDashboardData();
    } else if (sectionId.includes('urls')) {
        loadUrls();
    } else if (sectionId.includes('analytics')) {
        loadAnalyticsData();
    }

    showNotification('Data refreshed', 'success');
}

// Utility functions
function truncateUrl(url, length) {
    return url.length > length ? url.substring(0, length) + '...' : url;
}

function timeAgo(date) {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => document.body.removeChild(notification), 300);
    }, 3000);
}