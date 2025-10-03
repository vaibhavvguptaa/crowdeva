#!/usr/bin/env node
// Simple script to test project creation with proper authentication flow

import fetch from 'node-fetch';
import { v4 as uuidv4 } from 'uuid';

async function testProjectCreation() {
  try {
    console.log('Testing project creation with authentication...');
    
    // First, let's check if we can access the home page
    const homeResponse = await fetch('http://localhost:3000');
    console.log('Home page status:', homeResponse.status);
    
    // Try to get the CSRF token which is needed for authenticated requests
    const csrfResponse = await fetch('http://localhost:3000/api/csrf-token', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (csrfResponse.ok) {
      const csrfData = await csrfResponse.json();
      console.log('CSRF token obtained:', csrfData.token ? 'Yes' : 'No');
      
      // Create a test project
      const projectData = {
        id: `project-${Date.now()}`,
        name: 'Test Project from Script',
        description: 'This is a test project created via script',
        type: 'General',
        priority: 'medium',
        status: 'active',
        createdBy: 'test-user',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        assignees: [],
        files: [],
        metrics: {
          totalTasks: 0,
          completedTasks: 0,
          accuracy: 0,
          avgTimePerTask: '0 min',
          issuesFound: 0,
          qualityScore: 0,
          lastActivityAt: new Date().toISOString(),
        },
        rbac: {
          owner: 'test-user',
          admins: ['test-user'],
          managers: [],
          developers: [],
          vendors: [],
          evaluators: [],
          viewers: [],
        },
        tags: [],
        deadline: null,
        evaluationStructure: {
          form_version: "1.0",
          project_id: `project-${Date.now()}`,
          layout: {
            header: [],
            body: []
          }
        }
      };
      
      // Try to create the project
      const createResponse = await fetch('http://localhost:3000/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfData.token || '',
        },
        body: JSON.stringify(projectData)
      });
      
      console.log('Project creation status:', createResponse.status);
      
      if (createResponse.ok) {
        const result = await createResponse.json();
        console.log('Project created successfully:', result.name);
      } else {
        const errorText = await createResponse.text();
        console.log('Project creation failed:', createResponse.status, errorText);
      }
    } else {
      console.log('Failed to get CSRF token');
      const errorText = await csrfResponse.text();
      console.log('CSRF error:', errorText);
    }
  } catch (error) {
    console.error('Error testing project creation:', error.message);
  }
}

// Run the test
testProjectCreation();