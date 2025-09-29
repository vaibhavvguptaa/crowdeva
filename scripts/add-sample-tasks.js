#!/usr/bin/env node

// Script to add sample tasks to the database
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });

const addSampleTasks = async () => {
  console.log('Adding sample tasks...');
  console.log('====================');
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
    
    // Get a sample project to add tasks to
    const [projects] = await connection.execute('SELECT id FROM projects LIMIT 1');
    if (projects.length === 0) {
      console.log('No projects found. Please run the seeding script first.');
      await connection.end();
      return;
    }
    
    const projectId = projects[0].id;
    console.log(`Adding tasks to project: ${projectId}`);
    
    // Insert sample tasks
    console.log('Inserting sample tasks...');
    await connection.execute(`
      INSERT IGNORE INTO tasks (id, project_id, title, description, status, priority, assignee_id, estimated_time, actual_time, due_date, progress, labels, comments_count, upvotes, created_at, updated_at) VALUES
      ('task-1', ?, 'Data Collection', 'Collect training data for the model', 'completed', 'high', 'user-2', '2 hours', '1.5 hours', DATE_ADD(NOW(), INTERVAL 7 DAY), 100, '["data", "collection"]', 5, 3, NOW(), NOW()),
      ('task-2', ?, 'Model Training', 'Train the initial model with collected data', 'in-progress', 'high', 'user-2', '8 hours', '4 hours', DATE_ADD(NOW(), INTERVAL 14 DAY), 50, '["training", "ml"]', 2, 1, NOW(), NOW()),
      ('task-3', ?, 'Evaluation', 'Evaluate model performance and accuracy', 'pending', 'medium', 'user-4', '3 hours', NULL, DATE_ADD(NOW(), INTERVAL 21 DAY), 0, '["evaluation", "testing"]', 0, 0, NOW(), NOW())
    `, [projectId, projectId, projectId]);
    
    console.log('Sample tasks inserted successfully!');
    
    // Verify the tasks were inserted
    const [tasks] = await connection.execute('SELECT * FROM tasks WHERE project_id = ?', [projectId]);
    console.log(`Found ${tasks.length} tasks for project ${projectId}`);
    
    await connection.end();
  } catch (error) {
    console.error('Failed to add sample tasks:', error.message);
  }
};

addSampleTasks();