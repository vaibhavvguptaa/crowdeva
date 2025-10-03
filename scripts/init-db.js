#!/usr/bin/env node

// Script to initialize the database with schema
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });

const initDatabase = async () => {
  console.log('Database initialization script');
  console.log('==============================');
  console.log('');

  console.log('Environment variables:');
  console.log('DB_HOST:', process.env.DB_HOST);
  console.log('DB_USER:', process.env.DB_USER);
  console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '****' : 'NOT SET');
  console.log('DB_NAME:', process.env.DB_NAME);
  console.log('');

  // Check if required environment variables are set
  const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
  const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

  if (missingEnvVars.length > 0) {
    console.log('Missing required environment variables:');
    missingEnvVars.forEach(envVar => console.log(`  - ${envVar}`));
    console.log('');
    console.log('Please create a .env.local file with the following content:');
    console.log('  DB_HOST=localhost');
    console.log('  DB_USER=llm_user');
    console.log('  DB_PASSWORD=your_password');
    console.log('  DB_NAME=llm_evaluation');
    console.log('');
    console.log('And ensure MySQL is running with the database and user created.');
    return;
  }

  try {
    // Create connection specifying the database
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    console.log('Connected to MySQL server');
    
    // Read schema file
    const schemaPath = path.join(__dirname, '..', 'src', 'lib', 'db', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Split schema into individual statements
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    console.log(`Found ${statements.length} statements to execute`);
    
    // Execute each statement
    let tableCount = 0;
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await connection.execute(statement);
          // Extract table name for logging
          const tableNameMatch = statement.match(/CREATE TABLE.*?IF NOT EXISTS\s+(\w+)/i);
          if (tableNameMatch) {
            console.log(`  ✓ Created/updated table: ${tableNameMatch[1]}`);
            tableCount++;
          }
        } catch (err) {
          // Log the error but continue with other statements
          console.warn('Warning executing statement:', statement.substring(0, 50) + '...');
          console.warn('Error:', err.message);
        }
      }
    }
    
    console.log('');
    console.log(`Database initialization completed successfully! Created/updated ${tableCount} tables.`);
    console.log('');
    console.log('Next steps:');
    console.log('1. Start the application: npm run dev');
    
    await connection.end();
  } catch (error) {
    console.error('Database initialization failed:', error.message);
    console.log('');
    console.log('Troubleshooting:');
    console.log('1. Verify MySQL is running');
    console.log('2. Check database credentials in .env.local');
    console.log('3. Ensure the MySQL user has proper privileges');
  }
};

initDatabase();