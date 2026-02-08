const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const { nanoid } = require('nanoid');
const useragent = require('useragent');
const geoip = require('geoip-lite');
const path = require('path');
require('dotenv').config();

const app = express();

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "cdnjs.cloudflare.com", "cdn.jsdelivr.net"],
            styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com", "cdnjs.cloudflare.com"],
            fontSrc: ["'self'", "fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
}));

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Rate limiting
const limiter = rateLimit({
    windowMs: process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000,
    max: process.env.RATE_LIMIT_MAX_REQUESTS || 100,
    message: { error: 'Too many requests from this IP' }
});
app.use('/api/', limiter);

// Database connection
let db;
async function initDatabase() {
    try {
        db = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });
        console.log('✅ Connected to MySQL database');
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        process.exit(1);
    }
}

// Middleware to authenticate admin
const authenticateAdmin = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'Access token required' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const [users] = await db.execute('SELECT * FROM users WHERE id = ? AND role = "admin"', [decoded.id]);
        
        if (users.length === 0) {
            return res.status(403).json({ error: 'Admin access required' });
        }

        req.user = users[0];
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid or expired token' });
    }
};

// Routes

// Serve main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve admin login page
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin-login.html'));
});

// Admin login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = users[0];
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: { id: user.id, email: user.email, role: user.role }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Shorten URL
app.post('/api/shorten', async (req, res) => {
    try {
        const { url } = req.body;
        
        if (!url || !url.match(/^https?:\/\/.+/)) {
            return res.status(400).json({ error: 'Please provide a valid URL starting with http:// or https://' });
        }

        // Check if URL already exists
        const [existing] = await db.execute('SELECT * FROM urls WHERE original_url = ?', [url]);
        if (existing.length > 0) {
            return res.json({
                shortCode: existing[0].short_code,
                shortUrl: `${process.env.BASE_URL}/${existing[0].short_code}`,
                originalUrl: url,
                clicks: existing[0].clicks,
                createdAt: existing[0].created_at
            });
        }

        const shortCode = nanoid(7);
        const clientIp = req.ip || req.connection.remoteAddress;
        
        await db.execute(
            'INSERT INTO urls (original_url, short_code, created_ip) VALUES (?, ?, ?)',
            [url, shortCode, clientIp]
        );

        res.json({
            shortCode,
            shortUrl: `${process.env.BASE_URL}/${shortCode}`,
            originalUrl: url,
            clicks: 0,
            createdAt: new Date().toISOString()
        });
    } catch (error) {
        console.error('Shorten error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Redirect short URL
app.get('/:shortCode', async (req, res) => {
    try {
        const { shortCode } = req.params;

        const [urls] = await db.execute('SELECT * FROM urls WHERE short_code = ?', [shortCode]);
        if (urls.length === 0) {
            return res.status(404).sendFile(path.join(__dirname, '404.html'));
        }

        const url = urls[0];
        
        // Track click
        const clientIp = req.ip || req.connection.remoteAddress;
        const userAgent = req.headers['user-agent'] || '';
        const agent = useragent.parse(userAgent);
        const geo = geoip.lookup(clientIp);
        const referrer = req.headers.referer || 'direct';

        await db.execute(
            `INSERT INTO clicks (url_id, ip_address, user_agent, browser, os, country, city, referrer) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                url.id,
                clientIp,
                userAgent,
                `${agent.family} ${agent.major}`,
                `${agent.os.family} ${agent.os.major}`,
                geo?.country || 'Unknown',
                geo?.city || 'Unknown',
                referrer
            ]
        );

        // Update click count
        await db.execute('UPDATE urls SET clicks = clicks + 1 WHERE id = ?', [url.id]);

        res.redirect(url.original_url);
    } catch (error) {
        console.error('Redirect error:', error);
        res.status(500).send('Server error');
    }
});

// Get URL statistics
app.get('/api/stats/:shortCode', async (req, res) => {
    try {
        const { shortCode } = req.params;

        const [urls] = await db.execute('SELECT * FROM urls WHERE short_code = ?', [shortCode]);
        if (urls.length === 0) {
            return res.status(404).json({ error: 'URL not found' });
        }

        const url = urls[0];

        // Get click analytics
        const [clickStats] = await db.execute(`
            SELECT 
                COUNT(*) as total_clicks,
                COUNT(DISTINCT ip_address) as unique_visitors,
                DATE(clicked_at) as date,
                COUNT(*) as daily_clicks
            FROM clicks 
            WHERE url_id = ? 
            GROUP BY DATE(clicked_at)
            ORDER BY date DESC
            LIMIT 30
        `, [url.id]);

        const [browserStats] = await db.execute(`
            SELECT browser, COUNT(*) as count 
            FROM clicks 
            WHERE url_id = ? 
            GROUP BY browser 
            ORDER BY count DESC 
            LIMIT 10
        `, [url.id]);

        const [countryStats] = await db.execute(`
            SELECT country, COUNT(*) as count 
            FROM clicks 
            WHERE url_id = ? 
            GROUP BY country 
            ORDER BY count DESC 
            LIMIT 10
        `, [url.id]);

        const [referrerStats] = await db.execute(`
            SELECT referrer, COUNT(*) as count 
            FROM clicks 
            WHERE url_id = ? AND referrer != 'direct'
            GROUP BY referrer 
            ORDER BY count DESC 
            LIMIT 10
        `, [url.id]);

        res.json({
            url: {
                shortCode: url.short_code,
                originalUrl: url.original_url,
                clicks: url.clicks,
                createdAt: url.created_at
            },
            analytics: {
                totalClicks: url.clicks,
                uniqueVisitors: clickStats.length > 0 ? clickStats[0].unique_visitors : 0,
                dailyStats: clickStats,
                browsers: browserStats,
                countries: countryStats,
                referrers: referrerStats
            }
        });
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Admin Dashboard APIs

// Get dashboard statistics
app.get('/api/admin/dashboard', authenticateAdmin, async (req, res) => {
    try {
        const [totalUrls] = await db.execute('SELECT COUNT(*) as count FROM urls');
        const [totalClicks] = await db.execute('SELECT SUM(clicks) as count FROM urls');
        const [todayClicks] = await db.execute(`
            SELECT COUNT(*) as count FROM clicks 
            WHERE DATE(clicked_at) = CURDATE()
        `);

        const [recentUrls] = await db.execute(`
            SELECT u.*, 
                (SELECT COUNT(*) FROM clicks c WHERE c.url_id = u.id AND DATE(c.clicked_at) = CURDATE()) as today_clicks
            FROM urls u 
            ORDER BY u.created_at DESC 
            LIMIT 10
        `);

        const [clickTrends] = await db.execute(`
            SELECT DATE(clicked_at) as date, COUNT(*) as clicks 
            FROM clicks 
            WHERE clicked_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            GROUP BY DATE(clicked_at)
            ORDER BY date
        `);

        const [topUrls] = await db.execute(`
            SELECT short_code, original_url, clicks 
            FROM urls 
            WHERE clicks > 0
            ORDER BY clicks DESC 
            LIMIT 10
        `);

        res.json({
            stats: {
                totalUrls: totalUrls[0].count,
                totalClicks: totalClicks[0].count || 0,
                todayClicks: todayClicks[0].count,
                avgClicks: totalUrls[0].count > 0 ? Math.round((totalClicks[0].count || 0) / totalUrls[0].count) : 0
            },
            recentUrls,
            clickTrends,
            topUrls
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get all URLs with pagination
app.get('/api/admin/urls', authenticateAdmin, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        const search = req.query.search || '';
        const sortBy = req.query.sort || 'created_at';
        const order = req.query.order === 'asc' ? 'ASC' : 'DESC';

        let whereClause = '';
        let params = [];
        
        if (search) {
            whereClause = 'WHERE original_url LIKE ? OR short_code LIKE ?';
            params = [`%${search}%`, `%${search}%`];
        }

        const [urls] = await db.execute(`
            SELECT * FROM urls 
            ${whereClause}
            ORDER BY ${sortBy} ${order} 
            LIMIT ? OFFSET ?
        `, [...params, limit, offset]);

        const [total] = await db.execute(`
            SELECT COUNT(*) as count FROM urls ${whereClause}
        `, params);

        res.json({
            urls,
            pagination: {
                current: page,
                total: Math.ceil(total[0].count / limit),
                count: total[0].count
            }
        });
    } catch (error) {
        console.error('URLs fetch error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete URL
app.delete('/api/admin/urls/:id', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        // Delete clicks first (foreign key constraint)
        await db.execute('DELETE FROM clicks WHERE url_id = ?', [id]);
        
        // Delete URL
        await db.execute('DELETE FROM urls WHERE id = ?', [id]);

        res.json({ message: 'URL deleted successfully' });
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get detailed analytics for specific URL
app.get('/api/admin/analytics/:shortCode', authenticateAdmin, async (req, res) => {
    try {
        const { shortCode } = req.params;
        const days = parseInt(req.query.days) || 30;

        const [urls] = await db.execute('SELECT * FROM urls WHERE short_code = ?', [shortCode]);
        if (urls.length === 0) {
            return res.status(404).json({ error: 'URL not found' });
        }

        const url = urls[0];

        const [analytics] = await db.execute(`
            SELECT 
                DATE(clicked_at) as date,
                COUNT(*) as clicks,
                COUNT(DISTINCT ip_address) as unique_visitors
            FROM clicks 
            WHERE url_id = ? AND clicked_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
            GROUP BY DATE(clicked_at)
            ORDER BY date
        `, [url.id, days]);

        const [browsers] = await db.execute(`
            SELECT browser, COUNT(*) as count 
            FROM clicks 
            WHERE url_id = ? 
            GROUP BY browser 
            ORDER BY count DESC
        `, [url.id]);

        const [countries] = await db.execute(`
            SELECT country, COUNT(*) as count 
            FROM clicks 
            WHERE url_id = ? 
            GROUP BY country 
            ORDER BY count DESC
        `, [url.id]);

        const [referrers] = await db.execute(`
            SELECT 
                CASE 
                    WHEN referrer = 'direct' THEN 'Direct'
                    WHEN referrer LIKE '%google%' THEN 'Google'
                    WHEN referrer LIKE '%facebook%' THEN 'Facebook'
                    WHEN referrer LIKE '%twitter%' THEN 'Twitter'
                    ELSE 'Other'
                END as source,
                COUNT(*) as count
            FROM clicks 
            WHERE url_id = ?
            GROUP BY source
            ORDER BY count DESC
        `, [url.id]);

        res.json({
            url,
            analytics: {
                totalClicks: url.clicks,
                dailyStats: analytics,
                browsers,
                countries,
                referrers
            }
        });
    } catch (error) {
        console.error('Analytics error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// 404 handler
app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
        res.status(404).json({ error: 'API endpoint not found' });
    } else {
        res.status(404).sendFile(path.join(__dirname, '404.html'));
    }
});

// Error handler
app.use((error, req, res, next) => {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
});

// Initialize and start server
async function startServer() {
    await initDatabase();
    
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`📱 Application: http://localhost:${PORT}`);
        console.log(`👤 Admin Panel: http://localhost:${PORT}/admin`);
        console.log(`📧 Admin Email: ${process.env.ADMIN_EMAIL}`);
        console.log(`🔐 Admin Password: ${process.env.ADMIN_PASSWORD}`);
    });
}

startServer().catch(console.error);