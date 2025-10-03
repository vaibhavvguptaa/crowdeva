import mysql from 'mysql2/promise';

// Database configuration from .env.local
const dbConfig = {
  host: 'localhost',
  port: 3308,
  user: 'llm_user',
  password: 'llm_password',
  database: 'llm_evaluation',
};

console.log('Testing database connection with config:', dbConfig);

async function testConnection() {
  let connection;
  
  try {
    // Create connection
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to MySQL database successfully!');
    
    // Test a simple query
    const [rows] = await connection.execute('SELECT 1 as test');
    console.log('✅ Database query test result:', rows);
    
    console.log('✅ Database connection test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error testing database connection:', error.message);
    console.error('Error code:', error.code);
    console.error('Error errno:', error.errno);
    console.error('Error sqlState:', error.sqlState);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed.');
    }
  }
}

// Run the test
testConnection();