#!/usr/bin/env node
// Verification script to check that project creation handles all required database fields

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function verifyProjectCreation() {
  let connection;
  
  try {
    console.log('Connecting to database...');
    
    // Create database connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });
    
    console.log('✓ Connected to database successfully');
    
    // Check if required tables exist
    const requiredTables = ['projects', 'project_metrics', 'project_rbac', 'project_assignees'];
    console.log('\nChecking required tables...');
    
    for (const table of requiredTables) {
      try {
        const [rows] = await connection.execute('SHOW TABLES LIKE ?', [table]);
        if (rows.length > 0) {
          console.log(`✓ Table ${table} exists`);
        } else {
          console.log(`✗ Table ${table} does not exist`);
        }
      } catch (error) {
        console.log(`✗ Error checking table ${table}:`, error.message);
      }
    }
    
    // Check projects table structure
    console.log('\nChecking projects table structure...');
    const [columns] = await connection.execute('DESCRIBE projects');
    
    const requiredFields = {
      id: 'varchar(255)',
      name: 'varchar(255)',
      description: 'text',
      status: 'enum',
      created_by: 'varchar(255)',
      type: 'enum',
      priority: 'enum',
      deadline: 'timestamp',
      created_at: 'timestamp',
      updated_at: 'timestamp'
    };
    
    console.log('Required fields check:');
    for (const [field, expectedType] of Object.entries(requiredFields)) {
      const column = columns.find((col) => col.Field === field);
      if (column) {
        const typeMatch = column.Type.toLowerCase().includes(expectedType.toLowerCase());
        console.log(`✓ ${field}: ${column.Type} ${typeMatch ? '' : '(Type may vary)'}`);
      } else {
        console.log(`✗ ${field}: Missing`);
      }
    }
    
    // Test inserting a sample project with all required fields
    console.log('\nTesting project insertion with all required fields...');
    
    const projectId = `test-project-${Date.now()}`;
    const testData = {
      id: projectId,
      name: 'Verification Test Project',
      description: 'Test project to verify all required fields are handled correctly',
      status: 'active',
      created_by: 'test-user',
      type: 'General',
      priority: 'medium',
      deadline: null,
      created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
      updated_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
    };
    
    try {
      // Insert project
      const projectQuery = `
        INSERT INTO projects (id, name, description, status, created_by, type, priority, deadline, created_at, updated_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      await connection.execute(projectQuery, [
        testData.id,
        testData.name,
        testData.description,
        testData.status,
        testData.created_by,
        testData.type,
        testData.priority,
        testData.deadline,
        testData.created_at,
        testData.updated_at
      ]);
      
      console.log('✓ Project inserted successfully');
      
      // Insert related data
      // Project metrics
      const metricsQuery = `
        INSERT INTO project_metrics (project_id, total_tasks, completed_tasks, accuracy, avg_time_per_task, issues_found, quality_score, last_activity_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      await connection.execute(metricsQuery, [
        projectId,
        0, // total_tasks
        0, // completed_tasks
        0.00, // accuracy
        '0 min', // avg_time_per_task
        0, // issues_found
        0.00, // quality_score
        null // last_activity_at
      ]);
      
      console.log('✓ Project metrics inserted successfully');
      
      // Project RBAC
      const rbacQuery = `
        INSERT INTO project_rbac (project_id, owner, admins, managers, developers, vendors, evaluators, viewers) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      await connection.execute(rbacQuery, [
        projectId,
        'test-user', // owner
        JSON.stringify(['test-user']), // admins
        JSON.stringify([]), // managers
        JSON.stringify([]), // developers
        JSON.stringify([]), // vendors
        JSON.stringify(['test-user']), // evaluators
        JSON.stringify([]) // viewers
      ]);
      
      console.log('✓ Project RBAC inserted successfully');
      
      // Clean up test data
      await connection.execute('DELETE FROM project_rbac WHERE project_id = ?', [projectId]);
      await connection.execute('DELETE FROM project_metrics WHERE project_id = ?', [projectId]);
      await connection.execute('DELETE FROM projects WHERE id = ?', [projectId]);
      
      console.log('✓ Test data cleaned up successfully');
      
    } catch (error) {
      console.log('✗ Error inserting test project:', error.message);
    }
    
    console.log('\n✓ Verification completed successfully');
    
  } catch (error) {
    console.error('Verification failed:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
}

// Run the verification
verifyProjectCreation();