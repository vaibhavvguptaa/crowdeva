#!/usr/bin/env node
/**
 * Script to test the authentication flow
 */

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testAuthFlow() {
  try {
    console.log('Testing authentication flow...');
    
    // Test customer authentication
    console.log('\n1. Testing customer authentication...');
    const customerResponse = await fetch('http://localhost:3000/api/auth/location-aware', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'customer@example.com',
        password: 'password123',
        authType: 'customers'
      })
    });
    
    console.log('Customer auth response status:', customerResponse.status);
    const customerData = await customerResponse.json();
    console.log('Customer auth response:', JSON.stringify(customerData, null, 2));
    
    if (customerResponse.ok) {
      console.log('✅ Customer authentication successful!');
      
      // Extract cookies from the response
      const setCookieHeader = customerResponse.headers.get('set-cookie');
      console.log('Set-Cookie header:', setCookieHeader);
      
      // Try to access a protected route
      console.log('\n2. Testing access to protected route...');
      await delay(1000); // Wait a bit before testing
      
      const protectedResponse = await fetch('http://localhost:3000/projects', {
        method: 'GET',
        headers: { 
          'Cookie': setCookieHeader || ''
        }
      });
      
      console.log('Protected route response status:', protectedResponse.status);
      console.log('Protected route response headers:', Object.fromEntries(protectedResponse.headers.entries()));
      
      // Check if we're redirected
      if (protectedResponse.redirected) {
        console.log('_redirected to:', protectedResponse.url);
      }
    } else {
      console.log('❌ Customer authentication failed!');
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testAuthFlow();