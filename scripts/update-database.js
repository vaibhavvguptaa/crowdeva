const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

// Load environment variables
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

async function updateDatabase() {
  let connection;
  
  try {
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });
    
    console.log('Connected to database');
    
    // Read the schema file
    const schemaPath = path.resolve(__dirname, '../src/lib/db/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Extract the tasks table creation statement
    const tasksTableMatch = schema.match(/-- Tasks table\nCREATE TABLE IF NOT EXISTS tasks[\s\S]*?;/);
    if (!tasksTableMatch) {
      throw new Error('Could not find tasks table definition in schema');
    }
    
    const tasksTableSQL = tasksTableMatch[0];
    console.log('Creating tasks table...');
    await connection.execute(tasksTableSQL);
    console.log('Tasks table created successfully');
    
    // Extract the issues table creation statement
    const issuesTableMatch = schema.match(/-- Issues table\nCREATE TABLE IF NOT EXISTS issues[\s\S]*?;/);
    if (!issuesTableMatch) {
      throw new Error('Could not find issues table definition in schema');
    }
    
    const issuesTableSQL = issuesTableMatch[0];
    console.log('Creating issues table...');
    await connection.execute(issuesTableSQL);
    console.log('Issues table created successfully');
    
    // Extract the indexes for tasks table
    const tasksIndexesMatch = schema.match(/-- Indexes for tasks table\n[\s\S]*?;/g);
    if (tasksIndexesMatch) {
      for (const indexSQL of tasksIndexesMatch) {
        console.log('Creating tasks index...');
        await connection.execute(indexSQL);
        console.log('Tasks index created successfully');
      }
    }
    
    // Extract the indexes for issues table
    const issuesIndexesMatch = schema.match(/-- Indexes for issues table\n[\s\S]*?;/g);
    if (issuesIndexesMatch) {
      for (const indexSQL of issuesIndexesMatch) {
        console.log('Creating issues index...');
        await connection.execute(indexSQL);
        console.log('Issues index created successfully');
      }
    }
    
    console.log('Database update completed successfully');
  } catch (error) {
    console.error('Error updating database:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
}

// Run the update
updateDatabase();