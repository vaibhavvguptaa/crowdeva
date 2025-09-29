-- Migration to create project_settings table
CREATE TABLE IF NOT EXISTS project_settings (
  project_id VARCHAR(255) PRIMARY KEY,
  general_settings JSON NOT NULL,
  notification_settings JSON NOT NULL,
  privacy_settings JSON NOT NULL,
  team_settings JSON NOT NULL,
  vendor_settings JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Index for better performance
CREATE INDEX idx_project_settings_project_id ON project_settings(project_id);