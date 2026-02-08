-- Create database
CREATE DATABASE IF NOT EXISTS linkshort_db;
USE linkshort_db;

-- Users table for admin authentication
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'user') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- URLs table for storing shortened URLs
CREATE TABLE IF NOT EXISTS urls (
    id INT AUTO_INCREMENT PRIMARY KEY,
    original_url TEXT NOT NULL,
    short_code VARCHAR(10) UNIQUE NOT NULL,
    clicks INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_clicked TIMESTAMP NULL,
    INDEX idx_short_code (short_code),
    INDEX idx_created_at (created_at)
);

-- Analytics table for click tracking
CREATE TABLE IF NOT EXISTS analytics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    url_id INT NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    browser VARCHAR(100),
    os VARCHAR(100),
    device_type VARCHAR(50),
    referrer TEXT,
    clicked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (url_id) REFERENCES urls(id) ON DELETE CASCADE,
    INDEX idx_url_id (url_id),
    INDEX idx_clicked_at (clicked_at)
);

-- Insert sample data for demo
INSERT IGNORE INTO urls (original_url, short_code, clicks, created_at) VALUES
('https://google.com', 'abc123', 15, '2024-01-15 10:00:00'),
('https://github.com', 'def456', 8, '2024-01-16 11:30:00'),
('https://stackoverflow.com', 'ghi789', 23, '2024-01-17 14:15:00');