#!/usr/bin/env node

// Script to check sample projects in the database
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });

const checkSampleProjects = async () => {
  console.log('Checking sample projects...');
  console.log('========================');
  console.log('');

  try {
    // Create connection specifying the database
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    console.log('Connected to MySQL server');
    
    // Check what database we're connected to
    const [dbResult] = await connection.execute('SELECT DATABASE() as db');
    console.log('Current database:', dbResult[0].db);
    
    // Get sample projects
    const [projects] = await connection.execute('SELECT id, name FROM projects LIMIT 5');
    console.log('Sample projects:');
    projects.forEach((project, index) => {
      console.log(`${index + 1}. ${project.name} (ID: ${project.id})`);
    });
    
    if (projects.length > 0) {
      // Try to query tasks for the first project
      const projectId = projects[0].id;
      console.log(`\nChecking tasks for project: ${projectId}`);
      const [tasks] = await connection.execute('SELECT * FROM tasks WHERE project_id = ?', [projectId]);
      console.log(`Found ${tasks.length} tasks for project ${projectId}`);
      
      if (tasks.length > 0) {
        console.log('Sample task:', tasks[0]);
      }
    }
    
    await connection.end();
  } catch (error) {
    console.error('Database check failed:', error.message);
  }
};

checkSampleProjects();