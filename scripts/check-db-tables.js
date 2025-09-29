#!/usr/bin/env node

// Script to check what tables exist in the database
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });

const checkDatabaseTables = async () => {
  console.log('Checking database tables...');
  console.log('==========================');
  console.log('');

  console.log('Environment variables:');
  console.log('DB_HOST:', process.env.DB_HOST);
  console.log('DB_USER:', process.env.DB_USER);
  console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '****' : 'NOT SET');
  console.log('DB_NAME:', process.env.DB_NAME);
  console.log('');

  try {
    // Create connection specifying the database
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    console.log('Connected to MySQL server');
    
    // Check what database we're connected to
    const [dbResult] = await connection.execute('SELECT DATABASE() as db');
    console.log('Current database:', dbResult[0].db);
    
    // List all tables
    const [tables] = await connection.execute('SHOW TABLES');
    console.log('Tables in database:');
    tables.forEach((table) => {
      console.log('  -', Object.values(table)[0]);
    });
    
    // Check if tasks table exists specifically
    const [tasksResult] = await connection.execute("SHOW TABLES LIKE 'tasks'");
    if (tasksResult.length > 0) {
      console.log('');
      console.log('✓ tasks table exists');
      
      // Show table structure
      const [structure] = await connection.execute('DESCRIBE tasks');
      console.log('tasks table structure:');
      console.log(structure);
    } else {
      console.log('');
      console.log('✗ tasks table does not exist');
    }
    
    await connection.end();
  } catch (error) {
    console.error('Database check failed:', error.message);
  }
};

checkDatabaseTables();