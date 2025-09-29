# Project Settings Migration

## Overview
This document explains how to run the migration to create the project settings table in the database.

## Migration Details
The migration creates a new table called `project_settings` with the following structure:

```sql
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
```

## Running the Migration
To run the migration, execute the following command:

```bash
npm run db:migrate-settings
```

## Prerequisites
Before running the migration, ensure that:

1. The database is accessible and running
2. The database connection parameters are correctly configured in your environment variables:
   - `MYSQL_HOST`
   - `MYSQL_PORT`
   - `MYSQL_USER`
   - `MYSQL_PASSWORD`
   - `MYSQL_DATABASE`

## What Happens During the Migration
1. The script connects to the database using the configured connection parameters
2. It reads the migration SQL file from `src/lib/db/migrations/001_create_project_settings_table.sql`
3. It executes the SQL statements to create the table and index
4. If the table already exists, it will be updated with any new columns or indexes

## Rollback
If you need to rollback the migration, you would need to manually drop the table:

```sql
DROP TABLE IF EXISTS project_settings;
```

Note: This will permanently delete all project settings data.