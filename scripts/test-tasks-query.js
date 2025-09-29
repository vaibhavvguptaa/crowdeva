#!/usr/bin/env node

// Script to test tasks query directly
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });

const testTasksQuery = async () => {
  console.log('Testing tasks query...');
  console.log('====================');
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
    
    // Try to query the tasks table
    const [tasks] = await connection.execute('SELECT * FROM tasks LIMIT 5');
    console.log('Tasks query successful!');
    console.log('Found', tasks.length, 'tasks');
    
    if (tasks.length > 0) {
      console.log('Sample task:', tasks[0]);
    }
    
    await connection.end();
  } catch (error) {
    console.error('Tasks query failed:', error.message);
    console.error('Error code:', error.code);
    console.error('SQL message:', error.sqlMessage);
  }
};

testTasksQuery();