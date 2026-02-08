const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const useragent = require('express-useragent');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));
app.use(useragent.express());

// Database connection
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'linkshort_user',
    password: process.env.DB_PASSWORD || 'SecurePass123',
    database: process.env.DB_NAME || 'linkshort_db'
};

let db;

// Initialize database connection
async function initDB() {
    try {
        db = await mysql.createConnection(dbConfig);
        console.log('✅ Connected to MySQL database');
        
        // Test connection
        await db.execute('SELECT 1');
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        process.exit(1);
    }
}

// Generate short code
function generateShortCode() {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// Get client info
function getClientInfo(req) {
    const forwarded = req.headers['x-forwarded-for'];
    const ip = forwarded ? forwarded.split(',')[0] : req.connection.remoteAddress;
    
    return {
        ip: ip || 'unknown',
        userAgent: req.useragent.source || 'unknown',
        browser: req.useragent.browser || 'unknown',
        version: req.useragent.version || 'unknown',
        os: req.useragent.os || 'unknown',
        platform: req.useragent.platform || 'unknown',
        isMobile: req.useragent.isMobile || false,
        isDesktop: req.useragent.isDesktop || false,
        referrer: req.headers.referer || 'direct'
    };
}

// Auth middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ success: false, message: 'Access token required' });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key', (err, user) => {
        if (err) {
            return res.status(403).json({ success: false, message: 'Invalid token' });
        }
        req.user = user;
        next();
    });
};

// Routes

// API: Shorten URL
app.post('/api/shorten', async (req, res) => {
    try {
        const { url } = req.body;
        
        if (!url) {
            return res.status(400).json({ 
                success: false, 
                message: 'URL is required' 
            });
        }

        // Validate URL
        try {
            new URL(url);
        } catch {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid URL format' 
            });
        }

        // Check if URL already exists
        const [existing] = await db.execute(
            'SELECT * FROM urls WHERE original_url = ? ORDER BY created_at DESC LIMIT 1',
            [url]
        );

        if (existing.length > 0) {
            const shortUrl = `${req.protocol}://${req.get('host')}/${existing[0].short_code}`;
            return res.json({
                success: true,
                data: {
                    original_url: existing[0].original_url,
                    short_url: shortUrl,
                    short_code: existing[0].short_code,
                    clicks: existing[0].clicks,
                    created_at: existing[0].created_at
                }
            });
        }

        // Generate unique short code
        let shortCode;
        let attempts = 0;
        do {
            shortCode = generateShortCode();
            const [check] = await db.execute('SELECT id FROM urls WHERE short_code = ?', [shortCode]);
            if (check.length === 0) break;
            attempts++;
        } while (attempts < 10);

        if (attempts >= 10) {
            return res.status(500).json({ 
                success: false, 
                message: 'Could not generate unique short code' 
            });
        }

        // Insert into database
        await db.execute(
            'INSERT INTO urls (original_url, short_code, created_at) VALUES (?, ?, NOW())',
            [url, shortCode]
        );

        const shortUrl = `${req.protocol}://${req.get('host')}/${shortCode}`;

        res.json({
            success: true,
            data: {
                original_url: url,
                short_url: shortUrl,
                short_code: shortCode,
                clicks: 0,
                created_at: new Date()
            }
        });

    } catch (error) {
        console.error('Shorten URL error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
});

// Redirect short URL
app.get('/:shortCode', async (req, res) => {
    try {
        const { shortCode } = req.params;
        
        // Skip static files and API routes
        if (shortCode.includes('.') || shortCode === 'api' || shortCode === 'admin') {
            return res.status(404).send('Not Found');
        }

        const [results] = await db.execute(
            'SELECT * FROM urls WHERE short_code = ?',
            [shortCode]
        );

        if (results.length === 0) {
            return res.status(404).send(`
                <html>
                    <head><title>Link Not Found</title></head>
                    <body style="font-family: Arial; text-align: center; margin-top: 100px;">
                        <h1>🔗 Link Not Found</h1>
                        <p>The short link you're looking for doesn't exist.</p>
                        <a href="/" style="color: #667eea;">Go to LinkShort</a>
                    </body>
                </html>
            `);
        }

        const url = results[0];
        const clientInfo = getClientInfo(req);

        // Update click count
        await db.execute(
            'UPDATE urls SET clicks = clicks + 1, last_clicked = NOW() WHERE id = ?',
            [url.id]
        );

        // Record analytics
        await db.execute(`
            INSERT INTO analytics (url_id, ip_address, user_agent, browser, os, device_type, referrer, clicked_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
        `, [
            url.id,
            clientInfo.ip,
            clientInfo.userAgent,
            `${clientInfo.browser} ${clientInfo.version}`,
            clientInfo.os,
            clientInfo.isMobile ? 'Mobile' : 'Desktop',
            clientInfo.referrer
        ]);

        // Redirect
        res.redirect(url.original_url);

    } catch (error) {
        console.error('Redirect error:', error);
        res.status(500).send('Server Error');
    }
});

// API: Get URL stats
app.get('/api/stats/:shortCode', async (req, res) => {
    try {
        const { shortCode } = req.params;

        const [urls] = await db.execute(
            'SELECT * FROM urls WHERE short_code = ?',
            [shortCode]
        );

        if (urls.length === 0) {
            return res.status(404).json({ success: false, message: 'URL not found' });
        }

        const url = urls[0];

        // Get analytics
        const [analytics] = await db.execute(`
            SELECT 
                COUNT(*) as total_clicks,
                COUNT(DISTINCT ip_address) as unique_clicks,
                browser,
                os,
                device_type,
                referrer,
                DATE(clicked_at) as click_date,
                COUNT(*) as daily_clicks
            FROM analytics 
            WHERE url_id = ? 
            GROUP BY browser, os, device_type, referrer, DATE(clicked_at)
        `, [url.id]);

        res.json({
            success: true,
            data: {
                url: url,
                analytics: analytics
            }
        });

    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Admin login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const [users] = await db.execute(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const user = users[0];
        const validPassword = await bcrypt.compare(password, user.password);

        if (!validPassword) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'fallback-secret-key',
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Admin dashboard data
app.get('/api/admin/dashboard', authenticateToken, async (req, res) => {
    try {
        // Get stats
        const [stats] = await db.execute(`
            SELECT 
                COUNT(*) as total_urls,
                SUM(clicks) as total_clicks,
                COUNT(DISTINCT DATE(created_at)) as active_days
            FROM urls
        `);

        // Get recent URLs
        const [recentUrls] = await db.execute(`
            SELECT * FROM urls 
            ORDER BY created_at DESC 
            LIMIT 10
        `);

        // Get click analytics
        const [clickAnalytics] = await db.execute(`
            SELECT 
                DATE(clicked_at) as date,
                COUNT(*) as clicks
            FROM analytics 
            WHERE clicked_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            GROUP BY DATE(clicked_at)
            ORDER BY date DESC
        `);

        // Get top URLs
        const [topUrls] = await db.execute(`
            SELECT * FROM urls 
            ORDER BY clicks DESC 
            LIMIT 5
        `);

        res.json({
            success: true,
            data: {
                stats: stats[0],
                recentUrls,
                clickAnalytics,
                topUrls
            }
        });

    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get all URLs for admin
app.get('/api/admin/urls', authenticateToken, async (req, res) => {
    try {
        const { search, sort = 'created_at', order = 'DESC', page = 1, limit = 50 } = req.query;
        const offset = (page - 1) * limit;

        let query = 'SELECT * FROM urls';
        let countQuery = 'SELECT COUNT(*) as total FROM urls';
        let params = [];

        if (search) {
            query += ' WHERE original_url LIKE ? OR short_code LIKE ?';
            countQuery += ' WHERE original_url LIKE ? OR short_code LIKE ?';
            params = [`%${search}%`, `%${search}%`];
        }

        query += ` ORDER BY ${sort} ${order} LIMIT ? OFFSET ?`;
        params.push(parseInt(limit), parseInt(offset));

        const [urls] = await db.execute(query, params);
        const [total] = await db.execute(countQuery, params.slice(0, -2));

        res.json({
            success: true,
            data: {
                urls,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: total[0].total,
                    pages: Math.ceil(total[0].total / limit)
                }
            }
        });

    } catch (error) {
        console.error('Get URLs error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Delete URL (admin)
app.delete('/api/admin/urls/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        // Delete analytics first
        await db.execute('DELETE FROM analytics WHERE url_id = ?', [id]);
        
        // Delete URL
        await db.execute('DELETE FROM urls WHERE id = ?', [id]);

        res.json({ success: true, message: 'URL deleted successfully' });

    } catch (error) {
        console.error('Delete URL error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get URL analytics (admin)
app.get('/api/admin/analytics/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const [analytics] = await db.execute(`
            SELECT 
                browser,
                os,
                device_type,
                referrer,
                ip_address,
                clicked_at,
                COUNT(*) as clicks
            FROM analytics 
            WHERE url_id = ?
            GROUP BY browser, os, device_type, referrer, ip_address, DATE(clicked_at)
            ORDER BY clicked_at DESC
        `, [id]);

        res.json({
            success: true,
            data: analytics
        });

    } catch (error) {
        console.error('Analytics error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get homepage stats
app.get('/api/stats', async (req, res) => {
    try {
        const [stats] = await db.execute(`
            SELECT 
                COUNT(*) as total_urls,
                SUM(clicks) as total_clicks,
                COUNT(DISTINCT DATE(created_at)) as active_days
            FROM urls
        `);

        res.json({
            success: true,
            data: stats[0]
        });

    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Serve admin login page
app.get('/admin-login.html', (req, res) => {
    res.sendFile(__dirname + '/admin-login.html');
});

// Serve admin dashboard
app.get('/admin', (req, res) => {
    res.sendFile(__dirname + '/admin-dashboard.html');
});

// Start server
async function startServer() {
    await initDB();
    
    app.listen(PORT, () => {
        console.log(`🚀 LinkShort server running on port ${PORT}`);
        console.log(`📱 Frontend: http://localhost:${PORT}`);
        console.log(`🔧 Admin: http://localhost:${PORT}/admin-login.html`);
    });
}

startServer().catch(console.error);