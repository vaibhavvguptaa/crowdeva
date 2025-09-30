#!/usr/bin/env node
// Simple script to initialize the database with the required schema

import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database configuration
const dbConfig = {
  host: 'localhost',
  port: 3308, // Changed port to match our test MySQL container
  user: 'root',
  password: 'testpass',
  database: 'llm_evaluation',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

console.log('Connecting to MySQL database...');

async function initializeDatabase() {
  let connection;
  
  try {
    // Create connection
    connection = await mysql.createConnection(dbConfig);
    console.log('Connected to MySQL database successfully!');
    
    // Read the schema file
    const schemaPath = path.join(__dirname, '..', 'src', 'lib', 'db', 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('Creating database tables...');
    
    // Split the schema into individual statements
    const statements = schemaSql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    // Execute each statement
    for (const statement of statements) {
      if (statement.startsWith('--') || statement.trim() === '') {
        // Skip comments and empty statements
        continue;
      }
      
      try {
        await connection.execute(statement);
        console.log('Executed statement successfully');
      } catch (error) {
        // Skip errors for CREATE TABLE IF NOT EXISTS statements
        if (!error.message.includes('already exists')) {
          console.error('Error executing statement:', error.message);
          console.error('Statement:', statement.substring(0, 100) + '...');
        }
      }
    }
    
    console.log('Database initialization completed successfully!');
    
    // Create the llm_user if it doesn't exist
    try {
      await connection.execute(
        "CREATE USER IF NOT EXISTS 'llm_user'@'%' IDENTIFIED BY 'llm_password'"
      );
      console.log('Created llm_user successfully!');
    } catch (error) {
      console.log('User llm_user already exists or error creating user:', error.message);
    }
    
    // Grant privileges to llm_user
    try {
      await connection.execute(
        "GRANT ALL PRIVILEGES ON llm_evaluation.* TO 'llm_user'@'%'"
      );
      await connection.execute("FLUSH PRIVILEGES");
      console.log('Granted privileges to llm_user successfully!');
    } catch (error) {
      console.log('Error granting privileges:', error.message);
    }
    
  } catch (error) {
    console.error('Error initializing database:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed.');
    }
  }
}

// Run the initialization
initializeDatabase();