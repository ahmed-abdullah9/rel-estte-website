-- Create database and user
CREATE DATABASE IF NOT EXISTS linkshort_db;
CREATE USER IF NOT EXISTS 'linkshort_user'@'localhost' IDENTIFIED BY 'LinkShort123!';
GRANT ALL PRIVILEGES ON linkshort_db.* TO 'linkshort_user'@'localhost';
FLUSH PRIVILEGES;

USE linkshort_db;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('user', 'admin') DEFAULT 'user',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login DATETIME,
  INDEX idx_email (email),
  INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- URLs table
CREATE TABLE IF NOT EXISTS urls (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT,
  original_url VARCHAR(2048) NOT NULL,
  short_code VARCHAR(10) UNIQUE NOT NULL,
  title VARCHAR(255),
  click_count INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_accessed DATETIME,
  INDEX idx_short_code (short_code),
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at),
  INDEX idx_is_active (is_active),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- URL Analytics table (optional)
CREATE TABLE IF NOT EXISTS url_analytics (
  id INT PRIMARY KEY AUTO_INCREMENT,
  url_id INT NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  browser VARCHAR(100),
  operating_system VARCHAR(100),
  device_type VARCHAR(50),
  country VARCHAR(100),
  referrer VARCHAR(500),
  clicked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_url_id (url_id),
  INDEX idx_clicked_at (clicked_at),
  INDEX idx_country (country),
  INDEX idx_browser (browser),
  FOREIGN KEY (url_id) REFERENCES urls(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default admin user
INSERT IGNORE INTO users (email, password, role) VALUES 
('admin@linkshort.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/HBt6SfZqq', 'admin');

-- Insert sample URLs for testing
INSERT IGNORE INTO urls (original_url, short_code, click_count) VALUES
('https://google.com', 'google', 42),
('https://github.com', 'github', 28),
('https://stackoverflow.com', 'stack', 15);