#!/usr/bin/env node

// Script to run the project settings table migration
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env.local') });

// Get database connection from environment
const mysql = require('mysql2/promise');

async function runMigration() {
  let connection;
  
  try {
    // Create database connection using the same environment variables as the app
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'llm_user',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'llm_evaluation'
    });
    
    console.log('Connected to database');
    
    // Read migration file
    const migrationPath = path.join(__dirname, '..', 'src', 'lib', 'db', 'migrations', '001_create_project_settings_table.sql');
    const migrationSql = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('Running migration...');
    
    // Split the SQL into individual statements and execute each one
    const statements = migrationSql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    console.log(`Found ${statements.length} statements to execute`);
    
    // Execute each statement
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await connection.execute(statement);
          console.log(`  ✓ Executed statement: ${statement.substring(0, 50)}...`);
        } catch (err) {
          console.warn('Warning executing statement:', statement.substring(0, 50) + '...');
          console.warn('Error:', err.message);
        }
      }
    }
    
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run migration
runMigration();