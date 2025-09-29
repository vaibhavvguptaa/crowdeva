import mysql from 'mysql2/promise';

// Check if we're running on the server side
const isServer = typeof window === 'undefined';

// Check if environment variables are available
const hasDbConfig = process.env.DB_HOST && process.env.DB_USER && process.env.DB_NAME;

let pool: mysql.Pool | null = null;

// Only create the pool on the server side
if (isServer && hasDbConfig) {
  try {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'llm_user',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'llm_evaluation',
      waitForConnections: true,
      connectionLimit: 20, // Increased from 10 for better performance
      queueLimit: 0,
      connectTimeout: 60000, // 60 seconds
      keepAliveInitialDelay: 10000, // 10 seconds
      enableKeepAlive: true
    });
    console.log('Database connection pool created successfully');
  } catch (error) {
    console.error('Failed to create database connection pool:', error);
  }
} else if (!isServer) {
  console.warn('Database connection not available on client side');
} else {
  console.warn('Database configuration not found. Set DB_HOST, DB_USER, DB_PASSWORD, and DB_NAME environment variables.');
}

export default pool;