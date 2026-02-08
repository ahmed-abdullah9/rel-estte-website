const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function setupDatabase() {
    let connection;
    
    try {
        console.log('🔧 Setting up LinkShort database...');
        
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'linkshort_user',
            password: process.env.DB_PASSWORD || 'SecurePass123',
            database: process.env.DB_NAME || 'linkshort_db'
        });

        console.log('✅ Connected to database');

        // Create admin user
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@linkshort.com';
        const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!';
        const hashedPassword = await bcrypt.hash(adminPassword, 12);
        
        await connection.execute(`
            INSERT IGNORE INTO users (email, password, role) 
            VALUES (?, ?, 'admin')
        `, [adminEmail, hashedPassword]);

        console.log('✅ Admin user created/updated');
        console.log('');
        console.log('👤 Admin Credentials:');
        console.log(`📧 Email: ${adminEmail}`);
        console.log(`🔐 Password: ${adminPassword}`);
        console.log('');

        process.exit(0);
    } catch (error) {
        console.error('❌ Setup failed:', error.message);
        console.log('');
        console.log('💡 Make sure:');
        console.log('   - MySQL is running');
        console.log('   - Database and user exist');
        console.log('   - Credentials in .env are correct');
        process.exit(1);
    } finally {
        if (connection) await connection.end();
    }
}

setupDatabase();