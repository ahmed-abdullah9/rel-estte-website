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
app.use(express.static(__dirname));

// Database connection
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'linkshort_user',
    password: process.env.DB_PASSWORD || 'SecurePass123',
    database: process.env.DB_NAME || 'linkshort_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

// Test database connection
async function testDatabaseConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Database connected successfully');
        connection.release();
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        process.exit(1);
    }
}

// Generate unique short code
function generateShortCode() {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// Get client IP
function getClientIp(req) {
    return req.headers['x-forwarded-for']?.split(',')[0] || 
           req.headers['x-real-ip'] ||
           req.connection.remoteAddress || 
           req.socket.remoteAddress ||
           '127.0.0.1';
}

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/admin-login.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin-login.html'));
});

app.get('/admin-dashboard.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin-dashboard.html'));
});

// API: Shorten URL
app.post('/api/shorten', async (req, res) => {
    console.log('📝 Shorten request received:', req.body);
    
    try {
        const { url } = req.body;
        
        if (!url) {
            return res.status(400).json({ 
                success: false, 
                message: 'URL is required' 
            });
        }

        // Validate URL format
        let validUrl;
        try {
            validUrl = new URL(url);
        } catch (error) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid URL format' 
            });
        }

        // Check if URL already exists
        const [existing] = await pool.execute(
            'SELECT * FROM urls WHERE original_url = ? ORDER BY created_at DESC LIMIT 1',
            [validUrl.toString()]
        );

        if (existing.length > 0) {
            const existingUrl = existing[0];
            return res.json({
                success: true,
                data: {
                    id: existingUrl.id,
                    original_url: existingUrl.original_url,
                    short_code: existingUrl.short_code,
                    short_url: `${req.protocol}://${req.get('host')}/${existingUrl.short_code}`,
                    clicks: existingUrl.clicks,
                    created_at: existingUrl.created_at
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
            return res.status(500).json({ 
                success: false, 
                message: 'Failed to generate unique short code' 
            });
        }

        // Insert new URL
        const [result] = await pool.execute(
            'INSERT INTO urls (original_url, short_code, created_at) VALUES (?, ?, NOW())',
            [validUrl.toString(), shortCode]
        );

        console.log('✅ URL shortened successfully:', shortCode);

        res.json({
            success: true,
            data: {
                id: result.insertId,
                original_url: validUrl.toString(),
                short_code: shortCode,
                short_url: `${req.protocol}://${req.get('host')}/${shortCode}`,
                clicks: 0,
                created_at: new Date()
            }
        });

    } catch (error) {
        console.error('❌ Shorten URL error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error occurred' 
        });
    }
});

// Redirect short URL
app.get('/:shortCode', async (req, res) => {
    const { shortCode } = req.params;
    
    // Skip files and API routes
    if (shortCode.includes('.') || 
        shortCode === 'api' || 
        shortCode === 'admin-login.html' ||
        shortCode === 'admin-dashboard.html' ||
        shortCode.startsWith('css') ||
        shortCode.startsWith('js')) {
        return res.status(404).send('File Not Found');
    }

    try {
        console.log('🔗 Redirect request for:', shortCode);

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
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>
                        body { 
                            font-family: 'Inter', sans-serif; 
                            text-align: center; 
                            margin-top: 100px; 
                            background: linear-gradient(135deg, #667eea, #764ba2);
                            color: white;
                            min-height: 100vh;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            flex-direction: column;
                        }
                        .container { background: white; color: #333; padding: 3rem; border-radius: 20px; }
                        h1 { color: #e74c3c; margin-bottom: 1rem; }
                        a { color: #667eea; text-decoration: none; font-weight: bold; }
                        a:hover { text-decoration: underline; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>🔗 Link Not Found</h1>
                        <p>The short link you're looking for doesn't exist or has been removed.</p>
                        <br>
                        <a href="/">← Back to LinkShort</a>
                    </div>
                </body>
                </html>
            `);
        }

        const url = urls[0];
        const clientIp = getClientIp(req);
        const userAgent = req.useragent;

        // Record click analytics
        try {
            await pool.execute(`
                INSERT INTO clicks (url_id, ip_address, user_agent, browser, platform, referrer, created_at) 
                VALUES (?, ?, ?, ?, ?, ?, NOW())
            `, [
                url.id,
                clientIp,
                req.get('User-Agent') || '',
                userAgent.browser || 'Unknown',
                userAgent.platform || 'Unknown',
                req.get('Referer') || ''
            ]);

            // Update click count
            await pool.execute(
                'UPDATE urls SET clicks = clicks + 1, updated_at = NOW() WHERE id = ?',
                [url.id]
            );

            console.log('📊 Click recorded for:', shortCode);
        } catch (error) {
            console.error('⚠️ Analytics error:', error);
        }

        // Redirect to original URL
        console.log('➡️ Redirecting to:', url.original_url);
        res.redirect(url.original_url);

    } catch (error) {
        console.error('❌ Redirect error:', error);
        res.status(500).send(`
            <!DOCTYPE html>
            <html>
            <head><title>Server Error - LinkShort</title></head>
            <body style="font-family: Arial, sans-serif; text-align: center; margin-top: 100px;">
                <h1>Server Error</h1>
                <p>Something went wrong. Please try again later.</p>
                <a href="/">← Back to LinkShort</a>
            </body>
            </html>
        `);
    }
});

// API: Admin login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email and password are required' 
            });
        }

        const [users] = await pool.execute(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid credentials' 
            });
        }

        const user = users[0];
        const validPassword = await bcrypt.compare(password, user.password);
        
        if (!validPassword) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid credentials' 
            });
        }

        if (user.role !== 'admin') {
            return res.status(403).json({ 
                success: false, 
                message: 'Admin access required' 
            });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'fallback-secret',
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
        console.error('❌ Login error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
});

// Middleware: Authenticate admin
const authenticateAdmin = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ 
                success: false, 
                message: 'Access token required' 
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
        
        if (decoded.role !== 'admin') {
            return res.status(403).json({ 
                success: false, 
                message: 'Admin access required' 
            });
        }

        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ 
            success: false, 
            message: 'Invalid or expired token' 
        });
    }
};

// API: Admin dashboard
app.get('/api/admin/dashboard', authenticateAdmin, async (req, res) => {
    try {
        const [totalUrls] = await pool.execute('SELECT COUNT(*) as count FROM urls');
        const [totalClicks] = await pool.execute('SELECT SUM(clicks) as total FROM urls');
        const [todayUrls] = await pool.execute(
            'SELECT COUNT(*) as count FROM urls WHERE DATE(created_at) = CURDATE()'
        );
        const [todayClicks] = await pool.execute(
            'SELECT COUNT(*) as count FROM clicks WHERE DATE(created_at) = CURDATE()'
        );

        const [recentUrls] = await pool.execute(`
            SELECT id, original_url, short_code, clicks, created_at 
            FROM urls ORDER BY created_at DESC LIMIT 10
        `);

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
        console.error('❌ Dashboard error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
});

// API: Get all URLs
app.get('/api/admin/urls', authenticateAdmin, async (req, res) => {
    try {
        const { search, sort = 'created_at', order = 'DESC', page = 1, limit = 20 } = req.query;
        
        let query = 'SELECT * FROM urls';
        let queryParams = [];
        
        if (search) {
            query += ' WHERE original_url LIKE ? OR short_code LIKE ?';
            queryParams.push(`%${search}%`, `%${search}%`);
        }
        
        query += ` ORDER BY ${sort} ${order} LIMIT ${limit} OFFSET ${(page - 1) * limit}`;

        const [urls] = await pool.execute(query, queryParams);

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
        console.error('❌ Get URLs error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
});

// API: Delete URL
app.delete('/api/admin/urls/:id', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        await pool.execute('DELETE FROM clicks WHERE url_id = ?', [id]);
        const [result] = await pool.execute('DELETE FROM urls WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'URL not found' 
            });
        }

        res.json({ 
            success: true, 
            message: 'URL deleted successfully' 
        });

    } catch (error) {
        console.error('❌ Delete URL error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
});

// Start server
async function startServer() {
    try {
        await testDatabaseConnection();
        
        app.listen(PORT, () => {
            console.log('');
            console.log('🚀 LinkShort Server Started Successfully!');
            console.log('==========================================');
            console.log(`📱 Application: http://localhost:${PORT}`);
            console.log(`👨‍💼 Admin Panel: http://localhost:${PORT}/admin-login.html`);
            console.log('');
            console.log('👤 Admin Credentials:');
            console.log(`   📧 Email: ${process.env.ADMIN_EMAIL}`);
            console.log(`   🔐 Password: ${process.env.ADMIN_PASSWORD}`);
            console.log('');
            console.log('📊 Database: Connected ✅');
            console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log('==========================================');
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

startServer();

module.exports = app;