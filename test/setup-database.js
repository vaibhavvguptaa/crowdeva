#!/usr/bin/env node

// Script to set up the database and user properly
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const setupDatabase = async () => {
  console.log('Database setup script');
  console.log('====================');
  console.log('');

  // Prompt for root password if not provided in environment
  const rootPassword = process.env.MYSQL_ROOT_PASSWORD || '123456';

  try {
    // Connect as root to create database and user
    console.log('Connecting to MySQL as root...');
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: 'root',
      password: rootPassword // Using environment variable or default
    });

    console.log('Connected to MySQL server as root');
    
    // Create database if it doesn't exist
    await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\``);
    console.log(`Database '${process.env.DB_NAME}' created or already exists`);
    
    // Create user if it doesn't exist
    try {
      await connection.execute(
        `CREATE USER IF NOT EXISTS '${process.env.DB_USER}'@'localhost' IDENTIFIED BY '${process.env.DB_PASSWORD}'`
      );
      console.log(`User '${process.env.DB_USER}' created or already exists`);
    } catch (err) {
      console.log(`Note: Could not create user (may already exist): ${err.message}`);
    }
    
    // Grant privileges
    await connection.execute(
      `GRANT ALL PRIVILEGES ON \`${process.env.DB_NAME}\`.* TO '${process.env.DB_USER}'@'localhost'`
    );
    console.log(`Granted all privileges on '${process.env.DB_NAME}' to '${process.env.DB_USER}'`);
    
    // Flush privileges
    await connection.execute('FLUSH PRIVILEGES');
    console.log('Privileges flushed');
    
    // Close root connection
    await connection.end();
    
    // Test connection with new user
    console.log('Testing connection with new user...');
    const testConnection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });
    
    console.log('Successfully connected with llm_user!');
    
    // Close test connection
    await testConnection.end();
    
    console.log('');
    console.log('Database setup completed successfully!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Run the database initialization: npm run db:init');
    console.log('2. Start the application: npm run dev');
    
  } catch (error) {
    console.error('Database setup failed:', error.message);
    console.log('');
    console.log('Troubleshooting:');
    console.log('1. Make sure MySQL is running');
    console.log('2. Check if root password is correct');
    console.log('3. Set MYSQL_ROOT_PASSWORD environment variable with your MySQL root password');
    console.log('4. If you changed the root password, update this script accordingly');
  }
};

setupDatabase();