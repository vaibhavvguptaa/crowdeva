import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the project root
dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });

const testConnectionPool = async () => {
  try {
    console.log('Testing database connection pool...');
    
    // Create a connection pool similar to the one in src/lib/db/connection.ts
    const pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'llm_user',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'llm_evaluation',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
    
    console.log('Successfully created connection pool!');
    
    // Get a connection from the pool
    const connection = await pool.getConnection();
    console.log('Successfully got connection from pool!');
    
    // Test a simple query
    const [rows] = await connection.execute('SELECT 1 as test');
    console.log('Query result:', rows[0]);
    
    // Release the connection back to the pool
    connection.release();
    console.log('Connection released back to pool');
    
    // Close the pool
    await pool.end();
    console.log('Connection pool closed');
    
    console.log('Connection pool test completed successfully!');
  } catch (error) {
    console.error('Connection pool test failed:', error.message);
  }
};

testConnectionPool();