-- Migration to create client_error_analytics table
CREATE TABLE IF NOT EXISTS client_error_analytics (
  id INT AUTO_INCREMENT PRIMARY KEY,
  error_message TEXT NOT NULL,
  error_type ENUM('authentication', 'network', 'validation', 'unknown') NOT NULL,
  component VARCHAR(255) NOT NULL,
  user_agent TEXT,
  url TEXT,
  ip_address VARCHAR(45),
  session_id VARCHAR(255),
  user_id VARCHAR(255),
  auth_type VARCHAR(50),
  http_status INT,
  error_code VARCHAR(100),
  additional_data JSON,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_error_type (error_type),
  INDEX idx_component (component),
  INDEX idx_timestamp (timestamp)
);