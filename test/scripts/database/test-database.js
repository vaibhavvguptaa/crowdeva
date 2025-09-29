import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the project root
dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });

const testDatabase = async () => {
  try {
    console.log('Testing database connection and queries...');
    
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });
    
    console.log('Successfully connected to MySQL server!');
    
    // Test a simple query
    const [rows] = await connection.execute('SHOW TABLES');
    console.log(`Found ${rows.length} tables in the database:`);
    
    rows.forEach(row => {
      console.log(`  - ${Object.values(row)[0]}`);
    });
    
    await connection.end();
    console.log('Database test completed successfully!');
  } catch (error) {
    console.error('Database test failed:', error.message);
  }
};

testDatabase();