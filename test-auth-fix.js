#!/usr/bin/env node
// Simple script to test the authentication fix

import fetch from 'node-fetch';

async function testAuthFix() {
  try {
    console.log('Testing authentication fix...');
    
    // First, let's check if we can access the home page
    const homeResponse = await fetch('http://localhost:3000');
    console.log('Home page status:', homeResponse.status);
    
    // Try to get the CSRF token
    const csrfResponse = await fetch('http://localhost:3000/api/auth/csrf-token', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    console.log('CSRF token endpoint status:', csrfResponse.status);
    
    if (csrfResponse.ok) {
      const csrfData = await csrfResponse.json();
      console.log('CSRF token obtained successfully');
    } else {
      const errorText = await csrfResponse.text();
      console.log('CSRF token endpoint error:', csrfResponse.status, errorText);
    }
    
    // Try to access the projects endpoint without authentication
    const projectsResponse = await fetch('http://localhost:3000/api/projects', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    console.log('Projects endpoint status (without auth):', projectsResponse.status);
    
    if (projectsResponse.ok) {
      const projectsData = await projectsResponse.json();
      console.log('Projects endpoint accessible');
    } else {
      const errorText = await projectsResponse.text();
      console.log('Projects endpoint error (expected):', projectsResponse.status, errorText);
    }
    
  } catch (error) {
    console.error('Error testing authentication fix:', error.message);
  }
}

// Run the test
testAuthFix();