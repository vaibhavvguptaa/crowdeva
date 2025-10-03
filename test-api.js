#!/usr/bin/env node
// Simple script to test the API endpoints

import fetch from 'node-fetch';

async function testAPI() {
  try {
    console.log('Testing API endpoints...');
    
    // Test the projects GET endpoint (doesn't require authentication)
    const response = await fetch('http://localhost:3000/api/projects');
    
    if (response.ok) {
      const result = await response.json();
      console.log('Projects API is working. Found', result.length, 'projects');
    } else {
      const errorText = await response.text();
      console.error('Failed to fetch projects:', response.status, errorText);
    }
  } catch (error) {
    console.error('Error testing API:', error.message);
  }
}

// Run the test
testAPI();