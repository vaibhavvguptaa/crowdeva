#!/usr/bin/env node
// Comprehensive test to verify project creation with real data

import fetch from 'node-fetch';

async function testProjectCreationWithRealData() {
  try {
    console.log('Testing project creation with real data...');
    
    // Test data for creating a project with all required fields
    const projectData = {
      name: 'Real Data Test Project',
      description: 'This is a test project created to verify real data implementation',
      status: 'active',
      type: 'General',
      priority: 'medium',
      createdBy: 'test-user-id',
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
        lastActivityAt: new Date().toISOString()
      },
      rbac: {
        owner: 'test-user-id',
        admins: ['test-user-id'],
        managers: [],
        developers: [],
        vendors: [],
        evaluators: [],
        viewers: []
      },
      tags: ['test', 'real-data'],
      deadline: null
    };
    
    console.log('Project data to be sent:', JSON.stringify(projectData, null, 2));
    
    // Make a POST request to create a project
    const response = await fetch('http://localhost:3000/api/projects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(projectData)
    });
    
    console.log('Response status:', response.status);
    
    if (response.ok) {
      const result = await response.json();
      console.log('Project created successfully:', JSON.stringify(result, null, 2));
      return true;
    } else {
      const errorText = await response.text();
      console.error('Failed to create project:', response.status, errorText);
      return false;
    }
  } catch (error) {
    console.error('Error testing project creation:', error.message);
    return false;
  }
}

// Run the test
testProjectCreationWithRealData().then(success => {
  if (success) {
    console.log('✓ Project creation test with real data completed successfully');
  } else {
    console.log('✗ Project creation test with real data failed');
  }
});