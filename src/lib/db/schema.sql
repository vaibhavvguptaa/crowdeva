-- Database schema for LLM Evaluation Platform

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  avatar_url VARCHAR(512),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  user_id VARCHAR(255) NOT NULL,
  role ENUM('owner', 'admin', 'manager', 'developer', 'vendor', 'evaluator', 'viewer') NOT NULL,
  user_type ENUM('client', 'developer', 'vendor') NOT NULL,
  department VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  assigned_at TIMESTAMP,
  assigned_by VARCHAR(255)
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  status ENUM('active', 'pending', 'completed', 'paused', 'archived') NOT NULL,
  created_by VARCHAR(255) NOT NULL,
  type ENUM('Text Annotation', 'Image Classification', 'Sentiment Analysis', 'Named Entity Recognition', 'Audio Classification', 'Video Analysis', 'General') NOT NULL,
  priority ENUM('low', 'medium', 'high', 'urgent') NOT NULL,
  deadline TIMESTAMP NULL
);

-- Project RBAC table
CREATE TABLE IF NOT EXISTS project_rbac (
  project_id VARCHAR(255) PRIMARY KEY,
  owner VARCHAR(255) NOT NULL,
  admins JSON NOT NULL,
  managers JSON NOT NULL,
  developers JSON NOT NULL,
  vendors JSON NOT NULL,
  evaluators JSON NOT NULL,
  viewers JSON NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Project assignees table
CREATE TABLE IF NOT EXISTS project_assignees (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id VARCHAR(255) NOT NULL,
  assignee JSON NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Project metrics table
CREATE TABLE IF NOT EXISTS project_metrics (
  project_id VARCHAR(255) PRIMARY KEY,
  total_tasks INT DEFAULT 0,
  completed_tasks INT DEFAULT 0,
  accuracy DECIMAL(5,2) DEFAULT 0.00,
  avg_time_per_task VARCHAR(50) DEFAULT '0 min',
  issues_found INT DEFAULT 0,
  quality_score DECIMAL(5,2) DEFAULT 0.00,
  last_activity_at TIMESTAMP NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Project tags table
CREATE TABLE IF NOT EXISTS project_tags (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id VARCHAR(255) NOT NULL,
  tag VARCHAR(100) NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id VARCHAR(255) PRIMARY KEY,
  project_id VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status ENUM('completed', 'in-progress', 'pending') NOT NULL DEFAULT 'pending',
  priority ENUM('low', 'medium', 'high') NOT NULL DEFAULT 'medium',
  assignee_id VARCHAR(255),
  estimated_time VARCHAR(50),
  actual_time VARCHAR(50),
  due_date TIMESTAMP NULL,
  progress INT DEFAULT 0,
  labels JSON,
  comments_count INT DEFAULT 0,
  upvotes INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (assignee_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Issues table
CREATE TABLE IF NOT EXISTS issues (
  id VARCHAR(255) PRIMARY KEY,
  project_id VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  severity ENUM('low', 'medium', 'high', 'critical') NOT NULL DEFAULT 'medium',
  status ENUM('open', 'in-progress', 'resolved', 'closed') NOT NULL DEFAULT 'open',
  reporter_id VARCHAR(255) NOT NULL,
  assignee_id VARCHAR(255),
  category VARCHAR(100),
  tags JSON,
  comments_count INT DEFAULT 0,
  upvotes INT DEFAULT 0,
  affected_tasks INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (assignee_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Evaluation structures table
CREATE TABLE IF NOT EXISTS evaluation_structures (
  project_id VARCHAR(255) PRIMARY KEY,
  structure JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Indexes for better performance
CREATE INDEX idx_projects_created_by ON projects(created_by);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_type ON projects(type);
CREATE INDEX idx_project_assignees_project_id ON project_assignees(project_id);
CREATE INDEX idx_project_tags_project_id ON project_tags(project_id);
CREATE INDEX idx_project_tags_tag ON project_tags(tag);

-- Indexes for tasks table
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_assignee_id ON tasks(assignee_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);

-- Indexes for issues table
CREATE INDEX idx_issues_project_id ON issues(project_id);
CREATE INDEX idx_issues_assignee_id ON issues(assignee_id);
CREATE INDEX idx_issues_reporter_id ON issues(reporter_id);
CREATE INDEX idx_issues_status ON issues(status);
CREATE INDEX idx_issues_severity ON issues(severity);
CREATE INDEX idx_issues_category ON issues(category);

-- Additional indexes for improved project query performance
CREATE INDEX idx_projects_id ON projects(id);
CREATE INDEX idx_project_rbac_project_id ON project_rbac(project_id);
CREATE INDEX idx_project_metrics_project_id ON project_metrics(project_id);
CREATE INDEX idx_evaluation_structures_project_id ON evaluation_structures(project_id);

-- New tables for marketplace profiles
-- Developers table
CREATE TABLE IF NOT EXISTS developers (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  avatar VARCHAR(512),
  location VARCHAR(255),
  timezone VARCHAR(50),
  hourly_rate DECIMAL(10, 2),
  currency ENUM('USD', 'EUR', 'GBP', 'INR') DEFAULT 'USD',
  experience INT,
  rating DECIMAL(3, 2),
  review_count INT DEFAULT 0,
  completed_projects INT DEFAULT 0,
  response_time VARCHAR(100),
  last_active VARCHAR(100),
  verified BOOLEAN DEFAULT FALSE,
  top_rated BOOLEAN DEFAULT FALSE,
  badges JSON,
  description TEXT,
  github_url VARCHAR(512),
  linkedin_url VARCHAR(512),
  website_url VARCHAR(512),
  frameworks JSON,
  programming_languages JSON,
  api_experience JSON,
  preferred_project_types JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Vendors table
CREATE TABLE IF NOT EXISTS vendors (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  avatar VARCHAR(512),
  location VARCHAR(255),
  timezone VARCHAR(50),
  hourly_rate DECIMAL(10, 2),
  currency ENUM('USD', 'EUR', 'GBP', 'INR') DEFAULT 'USD',
  experience INT,
  rating DECIMAL(3, 2),
  review_count INT DEFAULT 0,
  completed_projects INT DEFAULT 0,
  response_time VARCHAR(100),
  last_active VARCHAR(100),
  verified BOOLEAN DEFAULT FALSE,
  top_rated BOOLEAN DEFAULT FALSE,
  badges JSON,
  description TEXT,
  company_name VARCHAR(255),
  company_size ENUM('1-10', '11-50', '51-200', '200+') DEFAULT '1-10',
  team_members INT,
  client_retention_rate DECIMAL(5, 2),
  average_project_duration VARCHAR(100),
  minimum_project_budget DECIMAL(12, 2),
  max_concurrent_projects INT,
  business_registration VARCHAR(255),
  insurance_coverage BOOLEAN DEFAULT FALSE,
  nda_signing BOOLEAN DEFAULT FALSE,
  payment_terms VARCHAR(100),
  industries JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  avatar VARCHAR(512),
  location VARCHAR(255),
  timezone VARCHAR(50),
  company_name VARCHAR(255),
  company_size ENUM('1-10', '11-50', '51-200', '200+') DEFAULT '1-10',
  industry VARCHAR(255),
  website VARCHAR(512),
  phone VARCHAR(50),
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Related tables for complex data
-- Developer skills
CREATE TABLE IF NOT EXISTS developer_skills (
  id INT AUTO_INCREMENT PRIMARY KEY,
  developer_id VARCHAR(255) NOT NULL,
  skill_name VARCHAR(100) NOT NULL,
  level ENUM('Beginner', 'Intermediate', 'Advanced', 'Expert') NOT NULL,
  years_of_experience INT,
  endorsed BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (developer_id) REFERENCES developers(id) ON DELETE CASCADE
);

-- Developer specializations
CREATE TABLE IF NOT EXISTS developer_specializations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  developer_id VARCHAR(255) NOT NULL,
  specialization VARCHAR(100) NOT NULL,
  FOREIGN KEY (developer_id) REFERENCES developers(id) ON DELETE CASCADE
);

-- Developer education
CREATE TABLE IF NOT EXISTS developer_education (
  id INT AUTO_INCREMENT PRIMARY KEY,
  developer_id VARCHAR(255) NOT NULL,
  institution VARCHAR(255) NOT NULL,
  degree VARCHAR(100) NOT NULL,
  field VARCHAR(100) NOT NULL,
  start_year INT,
  end_year INT,
  description TEXT,
  FOREIGN KEY (developer_id) REFERENCES developers(id) ON DELETE CASCADE
);

-- Developer certifications
CREATE TABLE IF NOT EXISTS developer_certifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  developer_id VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  issuer VARCHAR(255) NOT NULL,
  issue_date DATE,
  expiry_date DATE,
  credential_id VARCHAR(255),
  credential_url VARCHAR(512),
  FOREIGN KEY (developer_id) REFERENCES developers(id) ON DELETE CASCADE
);

-- Developer portfolio
CREATE TABLE IF NOT EXISTS developer_portfolio (
  id VARCHAR(255) PRIMARY KEY,
  developer_id VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  image_url VARCHAR(512),
  project_url VARCHAR(512),
  technologies JSON,
  completed_at DATE,
  client_testimonial TEXT,
  FOREIGN KEY (developer_id) REFERENCES developers(id) ON DELETE CASCADE
);

-- Developer languages
CREATE TABLE IF NOT EXISTS developer_languages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  developer_id VARCHAR(255) NOT NULL,
  language_name VARCHAR(100) NOT NULL,
  proficiency ENUM('Basic', 'Conversational', 'Fluent', 'Native') NOT NULL,
  FOREIGN KEY (developer_id) REFERENCES developers(id) ON DELETE CASCADE
);

-- Vendor services
CREATE TABLE IF NOT EXISTS vendor_services (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vendor_id VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category ENUM('Data Annotation', 'Model Training', 'Quality Assurance', 'Consulting', 'Custom Development') NOT NULL,
  pricing ENUM('Fixed', 'Hourly', 'Project-based') NOT NULL,
  delivery_time VARCHAR(100),
  FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE
);

-- Vendor portfolio
CREATE TABLE IF NOT EXISTS vendor_portfolio (
  id VARCHAR(255) PRIMARY KEY,
  vendor_id VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  image_url VARCHAR(512),
  project_url VARCHAR(512),
  technologies JSON,
  completed_at DATE,
  client_testimonial TEXT,
  FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE
);

-- Vendor languages
CREATE TABLE IF NOT EXISTS vendor_languages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vendor_id VARCHAR(255) NOT NULL,
  language_name VARCHAR(100) NOT NULL,
  proficiency ENUM('Basic', 'Conversational', 'Fluent', 'Native') NOT NULL,
  FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE
);

-- Client-side error analytics table
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

-- Indexes for better performance
CREATE INDEX idx_developers_rating ON developers(rating);
CREATE INDEX idx_developers_verified ON developers(verified);
CREATE INDEX idx_developers_top_rated ON developers(top_rated);
CREATE INDEX idx_vendors_rating ON vendors(rating);
CREATE INDEX idx_vendors_verified ON vendors(verified);
CREATE INDEX idx_vendors_top_rated ON vendors(top_rated);
CREATE INDEX idx_customers_verified ON customers(verified);