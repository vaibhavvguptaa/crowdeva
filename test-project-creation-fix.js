#!/usr/bin/env node
// Simple script to test creating a project with the fixed implementation

import fetch from 'node-fetch';

async function testCreateProject() {
  try {
    console.log('Testing project creation with fixed implementation...');
    
    // Test data for creating a project with all required fields
    const projectData = {
      name: 'Test Project Fixed',
      description: 'This is a test project created to verify the fixed implementation',
      status: 'active',
      type: 'General',
      priority: 'medium',
      createdBy: 'test-user'
    };
    
    // Make a POST request to create a project
    const response = await fetch('http://localhost:3000/api/projects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(projectData)
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('Project created successfully:', result);
    } else {
      const errorText = await response.text();
      console.error('Failed to create project:', response.status, errorText);
    }
  } catch (error) {
    console.error('Error testing project creation:', error.message);
  }
}

// Run the test
testCreateProject();