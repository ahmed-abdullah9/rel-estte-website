const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');
const useragent = require('express-useragent');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(useragent.express());
app.use(express.static('.'));

// Database connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'linkshort_user',
    password: process.env.DB_PASSWORD || 'SecurePass123',
    database: process.env.DB_NAME || 'linkshort_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Generate short code
function generateShortCode() {
    return crypto.randomBytes(4).toString('hex');
}

// Get client IP
function getClientIp(req) {
    return req.headers['x-forwarded-for'] || 
           req.connection.remoteAddress || 
           req.socket.remoteAddress ||
           (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
           '127.0.0.1';
}

// Routes

// Serve main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve admin login
app.get('/admin-login.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin-login.html'));
});

// Serve admin dashboard
app.get('/admin-dashboard.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin-dashboard.html'));
});

// Create short URL
app.post('/api/shorten', async (req, res) => {
    try {
        const { url } = req.body;
        
        if (!url) {
            return res.status(400).json({ message: 'URL is required' });
        }

        // Validate URL
        try {
            new URL(url);
        } catch {
            return res.status(400).json({ message: 'Invalid URL format' });
        }

        // Check if URL already exists
        const [existing] = await pool.execute(
            'SELECT * FROM urls WHERE original_url = ?',
            [url]
        );

        if (existing.length > 0) {
            return res.json({
                success: true,
                data: {
                    id: existing[0].id,
                    original_url: existing[0].original_url,
                    short_code: existing[0].short_code,
                    short_url: `${req.protocol}://${req.get('host')}/${existing[0].short_code}`,
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
            const [duplicate] = await pool.execute(
                'SELECT id FROM urls WHERE short_code = ?',
                [shortCode]
            );
            if (duplicate.length === 0) break;
            attempts++;
        } while (attempts < 10);

        if (attempts >= 10) {
            return res.status(500).json({ message: 'Failed to generate unique short code' });
        }

        // Insert new URL
        const [result] = await pool.execute(
            'INSERT INTO urls (original_url, short_code, created_at) VALUES (?, ?, NOW())',
            [url, shortCode]
        );

        // Get the created record
        const [newUrl] = await pool.execute(
            'SELECT * FROM urls WHERE id = ?',
            [result.insertId]
        );

        res.json({
            success: true,
            data: {
                id: newUrl[0].id,
                original_url: newUrl[0].original_url,
                short_code: newUrl[0].short_code,
                short_url: `${req.protocol}://${req.get('host')}/${newUrl[0].short_code}`,
                clicks: newUrl[0].clicks,
                created_at: newUrl[0].created_at
            }
        });

    } catch (error) {
        console.error('Shorten URL error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Redirect short URL
app.get('/:shortCode', async (req, res) => {
    try {
        const { shortCode } = req.params;
        
        // Skip if it's a file request
        if (shortCode.includes('.') || shortCode === 'api') {
            return res.status(404).send('Not Found');
        }

        // Get URL from database
        const [urls] = await pool.execute(
            'SELECT * FROM urls WHERE short_code = ?',
            [shortCode]
        );

        if (urls.length === 0) {
            return res.status(404).send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Link Not Found - LinkShort</title>
                    <style>
                        body { font-family: Arial, sans-serif; text-align: center; margin-top: 100px; }
                        h1 { color: #e74c3c; }
                        a { color: #3498db; text-decoration: none; }
                    </style>
                </head>
                <body>
                    <h1>Link Not Found</h1>
                    <p>The short link you're looking for doesn't exist.</p>
                    <a href="/">← Back to LinkShort</a>
                </body>
                </html>
            `);
        }

        const url = urls[0];
        const clientIp = getClientIp(req);
        const userAgent = req.useragent;

        // Record click analytics
        await pool.execute(`
            INSERT INTO clicks (url_id, ip_address, user_agent, browser, platform, created_at) 
            VALUES (?, ?, ?, ?, ?, NOW())
        `, [
            url.id,
            clientIp,
            req.get('User-Agent') || '',
            userAgent.browser || 'Unknown',
            userAgent.platform || 'Unknown'
        ]);

        // Update click count
        await pool.execute(
            'UPDATE urls SET clicks = clicks + 1, updated_at = NOW() WHERE id = ?',
            [url.id]
        );

        // Redirect to original URL
        res.redirect(url.original_url);

    } catch (error) {
        console.error('Redirect error:', error);
        res.status(500).send('Server error');
    }
});

// Get URL stats
app.get('/api/stats/:shortCode', async (req, res) => {
    try {
        const { shortCode } = req.params;

        const [urls] = await pool.execute(
            'SELECT * FROM urls WHERE short_code = ?',
            [shortCode]
        );

        if (urls.length === 0) {
            return res.status(404).json({ message: 'URL not found' });
        }

        res.json({
            success: true,
            data: {
                id: urls[0].id,
                original_url: urls[0].original_url,
                short_code: urls[0].short_code,
                clicks: urls[0].clicks,
                created_at: urls[0].created_at
            }
        });

    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Admin login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password required' });
        }

        // Get user from database
        const [users] = await pool.execute(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const user = users[0];

        // Verify password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check if user is admin
        if (user.role !== 'admin') {
            return res.status(403).json({ message: 'Admin access required' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'your-secret-key',
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
        res.status(500).json({ message: 'Server error' });
    }
});

// Admin middleware
const authenticateAdmin = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'Access token required' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        
        if (decoded.role !== 'admin') {
            return res.status(403).json({ message: 'Admin access required' });
        }

        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ message: 'Invalid token' });
    }
};

// Admin dashboard data
app.get('/api/admin/dashboard', authenticateAdmin, async (req, res) => {
    try {
        // Get total stats
        const [totalUrls] = await pool.execute('SELECT COUNT(*) as count FROM urls');
        const [totalClicks] = await pool.execute('SELECT SUM(clicks) as total FROM urls');
        const [todayUrls] = await pool.execute(
            'SELECT COUNT(*) as count FROM urls WHERE DATE(created_at) = CURDATE()'
        );
        const [todayClicks] = await pool.execute(`
            SELECT COUNT(*) as count FROM clicks 
            WHERE DATE(created_at) = CURDATE()
        `);

        // Get recent URLs
        const [recentUrls] = await pool.execute(`
            SELECT id, original_url, short_code, clicks, created_at 
            FROM urls ORDER BY created_at DESC LIMIT 10
        `);

        // Get click analytics for last 7 days
        const [clicksData] = await pool.execute(`
            SELECT DATE(created_at) as date, COUNT(*) as clicks 
            FROM clicks 
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            GROUP BY DATE(created_at)
            ORDER BY date ASC
        `);

        res.json({
            success: true,
            data: {
                stats: {
                    totalUrls: totalUrls[0].count,
                    totalClicks: totalClicks[0].total || 0,
                    todayUrls: todayUrls[0].count,
                    todayClicks: todayClicks[0].count
                },
                recentUrls: recentUrls.map(url => ({
                    ...url,
                    short_url: `${req.protocol}://${req.get('host')}/${url.short_code}`
                })),
                clicksChart: clicksData
            }
        });

    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all URLs for admin
app.get('/api/admin/urls', authenticateAdmin, async (req, res) => {
    try {
        const { search, sort = 'created_at', order = 'DESC', page = 1, limit = 20 } = req.query;
        
        let query = 'SELECT * FROM urls';
        let queryParams = [];
        
        if (search) {
            query += ' WHERE original_url LIKE ? OR short_code LIKE ?';
            queryParams.push(`%${search}%`, `%${search}%`);
        }
        
        query += ` ORDER BY ${sort} ${order}`;
        query += ` LIMIT ${limit} OFFSET ${(page - 1) * limit}`;

        const [urls] = await pool.execute(query, queryParams);

        // Get total count
        let countQuery = 'SELECT COUNT(*) as total FROM urls';
        if (search) {
            countQuery += ' WHERE original_url LIKE ? OR short_code LIKE ?';
        }
        const [total] = await pool.execute(countQuery, search ? [`%${search}%`, `%${search}%`] : []);

        res.json({
            success: true,
            data: {
                urls: urls.map(url => ({
                    ...url,
                    short_url: `${req.protocol}://${req.get('host')}/${url.short_code}`
                })),
                total: total[0].total,
                page: parseInt(page),
                limit: parseInt(limit)
            }
        });

    } catch (error) {
        console.error('Get URLs error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete URL
app.delete('/api/admin/urls/:id', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        // Delete clicks first (foreign key constraint)
        await pool.execute('DELETE FROM clicks WHERE url_id = ?', [id]);
        
        // Delete URL
        const [result] = await pool.execute('DELETE FROM urls WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'URL not found' });
        }

        res.json({ success: true, message: 'URL deleted successfully' });

    } catch (error) {
        console.error('Delete URL error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get analytics for specific URL
app.get('/api/admin/analytics/:id', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        // Get URL info
        const [urls] = await pool.execute('SELECT * FROM urls WHERE id = ?', [id]);
        
        if (urls.length === 0) {
            return res.status(404).json({ message: 'URL not found' });
        }

        // Get click analytics
        const [clicksByDate] = await pool.execute(`
            SELECT DATE(created_at) as date, COUNT(*) as clicks 
            FROM clicks 
            WHERE url_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            GROUP BY DATE(created_at)
            ORDER BY date ASC
        `, [id]);

        const [clicksByBrowser] = await pool.execute(`
            SELECT browser, COUNT(*) as clicks 
            FROM clicks 
            WHERE url_id = ?
            GROUP BY browser
            ORDER BY clicks DESC
            LIMIT 10
        `, [id]);

        const [clicksByPlatform] = await pool.execute(`
            SELECT platform, COUNT(*) as clicks 
            FROM clicks 
            WHERE url_id = ?
            GROUP BY platform
            ORDER BY clicks DESC
        `, [id]);

        res.json({
            success: true,
            data: {
                url: urls[0],
                clicksByDate,
                clicksByBrowser,
                clicksByPlatform
            }
        });

    } catch (error) {
        console.error('Analytics error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 LinkShort server running on port ${PORT}`);
    console.log(`📱 Access at: http://localhost:${PORT}`);
    console.log(`👨‍💼 Admin at: http://localhost:${PORT}/admin-login.html`);
});

module.exports = app;