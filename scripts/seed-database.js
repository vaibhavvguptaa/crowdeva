#!/usr/bin/env node

// Script to seed the database with initial data
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });

const seedDatabase = async () => {
  console.log('Database seeding script');
  console.log('======================');
  console.log('');

  // Check if required environment variables are set
  const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
  const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

  if (missingEnvVars.length > 0) {
    console.log('Missing required environment variables:');
    missingEnvVars.forEach(envVar => console.log(`  - ${envVar}`));
    console.log('');
    console.log('Please create a .env.local file with the following content:');
    console.log('  DB_HOST=localhost');
    console.log('  DB_USER=llm_user');
    console.log('  DB_PASSWORD=your_password');
    console.log('  DB_NAME=llm_evaluation');
    return;
  }

  // Check if we should insert sample data (controlled by environment variable)
  const insertSampleData = process.env.INSERT_SAMPLE_DATA === 'true';

  try {
    // Create connection
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    console.log('Connected to MySQL server');
    
    // Insert sample users
    console.log('Inserting sample users...');
    await connection.execute(`
      INSERT IGNORE INTO users (id, name, email, avatar_url, user_id, role, user_type, department, is_active, assigned_at, assigned_by) VALUES
      ('user-1', 'John Smith', 'john.smith@example.com', '/avatars/john.jpg', 'user-1', 'owner', 'client', 'Executive', true, NOW(), 'system'),
      ('user-2', 'Sarah Johnson', 'sarah.johnson@example.com', '/avatars/sarah.jpg', 'user-2', 'developer', 'developer', 'AI Engineering', true, NOW(), 'user-1'),
      ('user-3', 'Mike Chen', 'mike.chen@example.com', '/avatars/mike.jpg', 'user-3', 'vendor', 'vendor', 'Data Annotation Services', true, NOW(), 'user-1'),
      ('user-4', 'Emma Wilson', 'emma.wilson@example.com', '/avatars/emma.jpg', 'user-4', 'evaluator', 'developer', 'Quality Assurance', true, NOW(), 'user-1'),
      ('user-5', 'Alex Rodriguez', 'alex.rodriguez@example.com', '/avatars/alex.jpg', 'user-5', 'manager', 'client', 'Project Management', true, NOW(), 'user-1')
    `);
    
    // Insert sample projects only if enabled
    if (insertSampleData) {
      console.log('Inserting sample projects...');
      await connection.execute(`
        INSERT IGNORE INTO projects (id, name, description, status, created_by, type, priority, deadline, created_at, updated_at) VALUES
        ('project-1', 'E-commerce Product Classification', 'AI-powered product categorization system for online retail platforms with machine learning models', 'active', 'user-1', 'Image Classification', 'high', DATE_ADD(NOW(), INTERVAL 30 DAY), NOW(), NOW()),
        ('project-2', 'Sentiment Analysis Dashboard', 'Real-time sentiment analysis for customer feedback and social media monitoring with advanced NLP', 'active', 'user-2', 'Sentiment Analysis', 'medium', DATE_ADD(NOW(), INTERVAL 45 DAY), NOW(), NOW()),
        ('project-rlhf-001', 'LLM Response Quality Evaluation', 'Evaluate the quality of LLM responses to various prompts focusing on accuracy, relevance, and helpfulness.', 'active', 'user-1', 'General', 'high', DATE_ADD(NOW(), INTERVAL 60 DAY), NOW(), NOW()),
        ('project-rlhf-002', 'Safety and Bias Assessment', 'Assess LLM responses for potential safety issues, biases, and ethical concerns across different domains.', 'active', 'user-1', 'General', 'high', DATE_ADD(NOW(), INTERVAL 60 DAY), NOW(), NOW()),
        ('project-rlhf-003', 'Preference-Based Response Ranking', 'Rank multiple LLM responses to the same prompt based on preference, helping to fine-tune the model.', 'active', 'user-1', 'General', 'medium', DATE_ADD(NOW(), INTERVAL 45 DAY), NOW(), NOW())
      `);
      
      // Insert project RBAC
      console.log('Inserting project RBAC data...');
      await connection.execute(`
        INSERT IGNORE INTO project_rbac (project_id, owner, admins, managers, developers, vendors, evaluators, viewers) VALUES
        ('project-1', 'user-1', '["user-1"]', '["user-5"]', '["user-2"]', '[]', '["user-4"]', '[]'),
        ('project-2', 'user-2', '["user-2"]', '["user-5"]', '["user-2"]', '["user-3"]', '["user-4"]', '[]'),
        ('project-rlhf-001', 'user-1', '["user-1"]', '["user-5"]', '["user-2"]', '[]', '["user-4"]', '[]'),
        ('project-rlhf-002', 'user-1', '["user-1"]', '["user-5"]', '["user-2"]', '[]', '["user-4"]', '[]'),
        ('project-rlhf-003', 'user-1', '["user-1"]', '["user-5"]', '["user-2"]', '[]', '["user-4"]', '[]')
      `);
      
      // Insert project metrics
      console.log('Inserting project metrics...');
      await connection.execute(`
        INSERT IGNORE INTO project_metrics (project_id, total_tasks, completed_tasks, accuracy, avg_time_per_task, issues_found, quality_score, last_activity_at) VALUES
        ('project-1', 150, 125, 94.50, '2.3 min', 8, 92.80, NOW()),
        ('project-2', 200, 180, 97.20, '1.8 min', 3, 95.10, NOW()),
        ('project-rlhf-001', 150, 0, 0.00, '0 min', 0, 0.00, NOW()),
        ('project-rlhf-002', 200, 0, 0.00, '0 min', 0, 0.00, NOW()),
        ('project-rlhf-003', 120, 0, 0.00, '0 min', 0, 0.00, NOW())
      `);
      
      // Insert project assignees
      console.log('Inserting project assignees...');
      await connection.execute(`
        INSERT IGNORE INTO project_assignees (project_id, assignee) VALUES
        ('project-1', '{"id":"user-1","name":"John Smith","email":"john.smith@example.com","avatarUrl":"/avatars/john.jpg","userId":"user-1","role":"owner","userType":"client","isActive":true,"assignedAt":"2024-01-15T10:00:00Z","assignedBy":"user-1","permissions":{"canEdit":true,"canDelete":true,"canAssign":true,"canEvaluate":true,"canViewMetrics":true}}'),
        ('project-1', '{"id":"user-2","name":"Sarah Johnson","email":"sarah.johnson@example.com","avatarUrl":"/avatars/sarah.jpg","userId":"user-2","role":"developer","userType":"developer","department":"AI Engineering","isActive":true,"assignedAt":"2024-01-15T10:00:00Z","assignedBy":"user-1","permissions":{"canEdit":true,"canDelete":false,"canAssign":false,"canEvaluate":true,"canViewMetrics":true}}'),
        ('project-2', '{"id":"user-2","name":"Sarah Johnson","email":"sarah.johnson@example.com","avatarUrl":"/avatars/sarah.jpg","userId":"user-2","role":"developer","userType":"developer","department":"AI Engineering","isActive":true,"assignedAt":"2024-01-15T10:00:00Z","assignedBy":"user-1","permissions":{"canEdit":true,"canDelete":false,"canAssign":false,"canEvaluate":true,"canViewMetrics":true}}'),
        ('project-2', '{"id":"user-3","name":"Mike Chen","email":"mike.chen@example.com","avatarUrl":"/avatars/mike.jpg","userId":"user-3","role":"vendor","userType":"vendor","department":"Data Annotation Services","isActive":true,"assignedAt":"2024-01-10T08:30:00Z","assignedBy":"user-1","permissions":{"canEdit":true,"canDelete":false,"canAssign":false,"canEvaluate":false,"canViewMetrics":false}}'),
        ('project-rlhf-001', '{"id":"user-1","name":"John Smith","email":"john.smith@example.com","avatarUrl":"/avatars/john.jpg","userId":"user-1","role":"owner","userType":"client","isActive":true,"assignedAt":"2024-01-15T10:00:00Z","assignedBy":"user-1","permissions":{"canEdit":true,"canDelete":true,"canAssign":true,"canEvaluate":true,"canViewMetrics":true}}'),
        ('project-rlhf-002', '{"id":"user-1","name":"John Smith","email":"john.smith@example.com","avatarUrl":"/avatars/john.jpg","userId":"user-1","role":"owner","userType":"client","isActive":true,"assignedAt":"2024-01-15T10:00:00Z","assignedBy":"user-1","permissions":{"canEdit":true,"canDelete":true,"canAssign":true,"canEvaluate":true,"canViewMetrics":true}}'),
        ('project-rlhf-003', '{"id":"user-1","name":"John Smith","email":"john.smith@example.com","avatarUrl":"/avatars/john.jpg","userId":"user-1","role":"owner","userType":"client","isActive":true,"assignedAt":"2024-01-15T10:00:00Z","assignedBy":"user-1","permissions":{"canEdit":true,"canDelete":true,"canAssign":true,"canEvaluate":true,"canViewMetrics":true}}')
      `);
      
      // Insert project tags
      console.log('Inserting project tags...');
      await connection.execute(`
        INSERT IGNORE INTO project_tags (project_id, tag) VALUES
        ('project-1', 'machine-learning'),
        ('project-1', 'e-commerce'),
        ('project-1', 'computer-vision'),
        ('project-2', 'nlp'),
        ('project-2', 'sentiment-analysis'),
        ('project-2', 'real-time'),
        ('project-rlhf-001', 'llm'),
        ('project-rlhf-001', 'evaluation'),
        ('project-rlhf-001', 'quality'),
        ('project-rlhf-002', 'llm'),
        ('project-rlhf-002', 'safety'),
        ('project-rlhf-002', 'bias'),
        ('project-rlhf-003', 'llm'),
        ('project-rlhf-003', 'preference'),
        ('project-rlhf-003', 'ranking')
      `);
    } else {
      console.log('Skipping sample projects insertion (set INSERT_SAMPLE_DATA=true to enable)');
    }
    
    console.log('');
    console.log('Database seeding completed successfully!');
    if (insertSampleData) {
      console.log('Inserted sample data for testing.');
    } else {
      console.log('Inserted core data only (no sample projects).');
    }
    
    await connection.end();
  } catch (error) {
    console.error('Database seeding failed:', error.message);
    console.log('');
    console.log('Troubleshooting:');
    console.log('1. Verify MySQL is running');
    console.log('2. Check database credentials in .env.local');
    console.log('3. Ensure the MySQL user has proper privileges');
    console.log('4. Run "npm run db:init" first to create the schema');
  }
};

seedDatabase();