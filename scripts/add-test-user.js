#!/usr/bin/env node
// Script to add a test user to the database

import mysql from 'mysql2/promise';

// Database configuration
const dbConfig = {
  host: 'localhost',
  port: 3308,
  user: 'llm_user',
  password: 'llm_password',
  database: 'llm_evaluation',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

console.log('Adding test user to database...');

async function addTestUser() {
  let connection;
  
  try {
    // Create connection
    connection = await mysql.createConnection(dbConfig);
    console.log('Connected to MySQL database successfully!');
    
    // Insert a test user
    const userId = 'test-user-1';
    const userName = 'Test User';
    const userEmail = 'test@example.com';
    const userRole = 'owner';
    const userType = 'client';
    
    const query = `
      INSERT INTO users (id, name, email, user_id, role, user_type, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE name = VALUES(name), email = VALUES(email)
    `;
    
    const params = [userId, userName, userEmail, userId, userRole, userType, true];
    
    const [result] = await connection.execute(query, params);
    console.log('Test user added successfully:', result);
    
    // Also add the user to a project RBAC entry to test project creation
    const projectId = 'test-project-1';
    
    // Create a test project
    const projectQuery = `
      INSERT INTO projects (id, name, description, status, created_by, type, priority)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE name = VALUES(name)
    `;
    
    const projectParams = [
      projectId,
      'Test Project',
      'This is a test project',
      'active',
      userId,
      'General',
      'medium'
    ];
    
    const [projectResult] = await connection.execute(projectQuery, projectParams);
    console.log('Test project created successfully:', projectResult);
    
    // Create RBAC entry for the project
    const rbacQuery = `
      INSERT INTO project_rbac (project_id, owner, admins, managers, developers, vendors, evaluators, viewers)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE owner = VALUES(owner)
    `;
    
    const rbacParams = [
      projectId,
      userId,
      JSON.stringify([userId]),
      JSON.stringify([]),
      JSON.stringify([]),
      JSON.stringify([]),
      JSON.stringify([userId]),
      JSON.stringify([])
    ];
    
    const [rbacResult] = await connection.execute(rbacQuery, rbacParams);
    console.log('Project RBAC entry created successfully:', rbacResult);
    
    console.log('Test user and project setup completed successfully!');
    
  } catch (error) {
    console.error('Error adding test user:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed.');
    }
  }
}

// Run the function
addTestUser();