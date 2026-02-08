const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Create database and tables if they don't exist
const createDatabase = async () => {
    try {
        // Create database
        const connection = mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD
        });

        await connection.promise().execute(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`);
        connection.end();

        // Create tables
        const createTables = `
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role ENUM('admin', 'user') DEFAULT 'user',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS properties (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                price DECIMAL(15,2) NOT NULL,
                property_type ENUM('apartment', 'villa', 'office', 'land') NOT NULL,
                status ENUM('for_sale', 'for_rent') NOT NULL,
                location VARCHAR(255) NOT NULL,
                area DECIMAL(10,2),
                bedrooms INT,
                bathrooms INT,
                features TEXT,
                image_url VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS inquiries (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL,
                phone VARCHAR(20),
                property_id INT,
                inquiry_type VARCHAR(100),
                message TEXT,
                status ENUM('new', 'in_progress', 'completed') DEFAULT 'new',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE SET NULL
            );

            INSERT IGNORE INTO users (email, password, role) 
            VALUES ('admin@realestate.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin');
        `;

        const queries = createTables.split(';').filter(query => query.trim());
        for (const query of queries) {
            if (query.trim()) {
                await pool.promise().execute(query);
            }
        }

        console.log('Database and tables created successfully');
    } catch (error) {
        console.error('Database setup error:', error);
    }
};

createDatabase();

module.exports = pool.promise();