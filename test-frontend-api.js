#!/usr/bin/env node
// Simple script to test the frontend API endpoints

import fetch from 'node-fetch';
import fs from 'fs';

async function testFrontendAPI() {
  try {
    console.log('Testing frontend API endpoints...');
    
    // First check if the Next.js server is running
    try {
      const homeResponse = await fetch('http://localhost:3000');
      console.log('Next.js server status:', homeResponse.status);
    } catch (error) {
      console.error('Next.js server is not accessible:', error.message);
      return;
    }
    
    // Test the API endpoint without authentication
    const response = await fetch('http://localhost:3000/api/projects', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    console.log('API response status:', response.status);
    
    if (response.ok) {
      const result = await response.json();
      console.log('Projects API is working. Found', result.length, 'projects');
    } else {
      const errorText = await response.text();
      console.log('API response error:', errorText);
    }
  } catch (error) {
    console.error('Error testing frontend API:', error.message);
  }
}

// Run the test
testFrontendAPI();