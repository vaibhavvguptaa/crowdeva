import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const checkProjects = async () => {
  try {
    console.log('Checking projects in database...');
    
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });
    
    console.log('Successfully connected to MySQL server!');
    
    // Check projects count
    const [rows] = await connection.execute('SELECT COUNT(*) as count FROM projects');
    console.log('Projects count:', rows[0].count);
    
    // Check if there are any projects
    if (rows[0].count > 0) {
      const [projects] = await connection.execute('SELECT * FROM projects LIMIT 5');
      console.log('Sample projects:');
      console.log(projects);
    } else {
      console.log('No projects found in database.');
    }
    
    await connection.end();
    console.log('Check completed successfully!');
  } catch (error) {
    console.error('Check failed:', error.message);
  }
};

checkProjects();