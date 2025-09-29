// Test the database connection using the same logic as connection.ts
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the project root
dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });

console.log('Testing database connection pool logic...');

// Check if environment variables are available
const hasDbConfig = process.env.DB_HOST && process.env.DB_USER && process.env.DB_NAME;

if (hasDbConfig) {
  try {
    const pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'llm_user',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'llm_evaluation',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
    
    console.log('Database connection pool created successfully');
    
    // Test the pool
    const testPool = async () => {
      try {
        const connection = await pool.getConnection();
        console.log('Successfully got connection from pool!');
        
        const [rows] = await connection.execute('SELECT 1 as test');
        console.log('Query result:', rows[0]);
        
        connection.release();
        console.log('Connection released back to pool');
        
        // Close the pool
        await pool.end();
        console.log('Connection pool closed');
        
        console.log('Connection pool test completed successfully!');
      } catch (error) {
        console.error('Pool test failed:', error.message);
      }
    };
    
    testPool();
  } catch (error) {
    console.error('Failed to create database connection pool:', error);
  }
} else {
  console.warn('Database configuration not found. Set DB_HOST, DB_USER, DB_PASSWORD, and DB_NAME environment variables.');
}