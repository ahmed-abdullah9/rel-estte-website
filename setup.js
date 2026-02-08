const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function setupDatabase() {
    let connection;
    
    try {
        console.log('🔧 Setting up database...');
        
        // Connect to database
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        console.log('✅ Connected to database');

        // Create admin user
        const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
        
        await connection.execute(`
            INSERT IGNORE INTO users (email, password, role) 
            VALUES (?, ?, 'admin')
        `, [process.env.ADMIN_EMAIL, hashedPassword]);

        console.log('✅ Admin user created');
        console.log(`📧 Email: ${process.env.ADMIN_EMAIL}`);
        console.log(`🔐 Password: ${process.env.ADMIN_PASSWORD}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Setup failed:', error.message);
        process.exit(1);
    } finally {
        if (connection) await connection.end();
    }
}

setupDatabase();