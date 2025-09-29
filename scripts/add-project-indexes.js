/**
 * Script to add missing indexes for improved project query performance
 * Run this script to add indexes to existing databases
 */

const mysql = require('mysql2/promise');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

async function addProjectIndexes() {
  let connection;
  
  try {
    // Create database connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'password',
      database: process.env.DB_NAME || 'crowdeval'
    });
    
    console.log('Connected to database');
    
    // Check if indexes already exist
    const [indexes] = await connection.execute(
      "SHOW INDEX FROM projects WHERE Key_name IN ('idx_projects_id')"
    );
    
    if (indexes.length === 0) {
      console.log('Adding indexes to projects table...');
      await connection.execute(
        'CREATE INDEX idx_projects_id ON projects(id)'
      );
      console.log('Added idx_projects_id index');
    } else {
      console.log('idx_projects_id index already exists');
    }
    
    // Check if indexes already exist for project_rbac
    const [rbacIndexes] = await connection.execute(
      "SHOW INDEX FROM project_rbac WHERE Key_name IN ('idx_project_rbac_project_id')"
    );
    
    if (rbacIndexes.length === 0) {
      console.log('Adding indexes to project_rbac table...');
      await connection.execute(
        'CREATE INDEX idx_project_rbac_project_id ON project_rbac(project_id)'
      );
      console.log('Added idx_project_rbac_project_id index');
    } else {
      console.log('idx_project_rbac_project_id index already exists');
    }
    
    // Check if indexes already exist for project_metrics
    const [metricsIndexes] = await connection.execute(
      "SHOW INDEX FROM project_metrics WHERE Key_name IN ('idx_project_metrics_project_id')"
    );
    
    if (metricsIndexes.length === 0) {
      console.log('Adding indexes to project_metrics table...');
      await connection.execute(
        'CREATE INDEX idx_project_metrics_project_id ON project_metrics(project_id)'
      );
      console.log('Added idx_project_metrics_project_id index');
    } else {
      console.log('idx_project_metrics_project_id index already exists');
    }
    
    // Check if indexes already exist for evaluation_structures
    const [evalIndexes] = await connection.execute(
      "SHOW INDEX FROM evaluation_structures WHERE Key_name IN ('idx_evaluation_structures_project_id')"
    );
    
    if (evalIndexes.length === 0) {
      console.log('Adding indexes to evaluation_structures table...');
      await connection.execute(
        'CREATE INDEX idx_evaluation_structures_project_id ON evaluation_structures(project_id)'
      );
      console.log('Added idx_evaluation_structures_project_id index');
    } else {
      console.log('idx_evaluation_structures_project_id index already exists');
    }
    
    console.log('All indexes added successfully!');
  } catch (error) {
    console.error('Error adding indexes:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
}

// Run the script
if (require.main === module) {
  addProjectIndexes();
}

module.exports = { addProjectIndexes };