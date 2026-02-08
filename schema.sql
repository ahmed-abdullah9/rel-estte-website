-- LinkShort Database Schema
SET FOREIGN_KEY_CHECKS = 0;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('user', 'admin') DEFAULT 'user',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login DATETIME NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- URLs table
CREATE TABLE IF NOT EXISTS urls (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NULL,
  original_url TEXT NOT NULL,
  short_code VARCHAR(20) UNIQUE NOT NULL,
  title VARCHAR(500) NULL,
  click_count INT DEFAULT 0,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_accessed DATETIME NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_short_code (short_code),
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at),
  INDEX idx_is_active (is_active),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Analytics table (optional - for detailed tracking)
CREATE TABLE IF NOT EXISTS url_analytics (
  id INT PRIMARY KEY AUTO_INCREMENT,
  url_id INT NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  browser VARCHAR(100),
  operating_system VARCHAR(100),
  device_type VARCHAR(50),
  country VARCHAR(100),
  referrer TEXT,
  clicked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_url_id (url_id),
  INDEX idx_clicked_at (clicked_at),
  INDEX idx_country (country),
  FOREIGN KEY (url_id) REFERENCES urls(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert default admin user
INSERT IGNORE INTO users (email, password, role, created_at) VALUES 
('admin@linkshort.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewYT3UBH2Q9eQpL2', 'admin', NOW());
-- Password: Admin123!

SET FOREIGN_KEY_CHECKS = 1;