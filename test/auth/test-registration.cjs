const { default: fetch } = require('node-fetch');

async function testRegistration() {
  try {
    console.log('Testing user registration process...');
    
    // Create a session by getting cookies first
    console.log('\n1. Initializing session...');
    const initResponse = await fetch('http://localhost:3000/api/auth/csrf-token');
    const cookies = initResponse.headers.raw()['set-cookie'] || [];
    console.log(`Session initialized with ${cookies.length} cookies`);
    
    // Now get CSRF token with cookies
    console.log('\n2. Getting CSRF token...');
    const csrfResponse = await fetch('http://localhost:3000/api/auth/csrf-token', {
      headers: {
        'Cookie': cookies.join('; ')
      }
    });
    
    console.log(`CSRF token response status: ${csrfResponse.status}`);
    
    if (!csrfResponse.ok) {
      console.error('Failed to get CSRF token');
      const errorText = await csrfResponse.text();
      console.error(`Error details: ${errorText}`);
      return;
    }
    
    const { csrfToken } = await csrfResponse.json();
    console.log(`CSRF token acquired: ${csrfToken ? csrfToken.substring(0, 10) + '...' : 'No'}`);
    
    // Get updated cookies after CSRF token request
    const updatedCookies = csrfResponse.headers.raw()['set-cookie'] || [];
    const allCookies = [...cookies, ...updatedCookies].join('; ');
    
    // Now try to register a user with a unique email
    console.log('\n3. Registering user...');
    const timestamp = Date.now();
    const registrationData = {
      email: `test-${timestamp}@example.com`,
      password: 'TestPassword123!',
      companyName: 'Test Company',
      firstName: 'Test',
      lastName: 'User',
      group: 'customers'
    };
    
    const registerResponse = await fetch('http://localhost:3000/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': allCookies,
        ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
      },
      body: JSON.stringify(registrationData)
    });
    
    console.log(`Registration response status: ${registerResponse.status}`);
    console.log(`Registration response headers:`, Object.fromEntries(registerResponse.headers.entries()));
    
    if (registerResponse.ok) {
      const registerData = await registerResponse.json();
      console.log('Registration successful:', registerData);
    } else {
      const errorText = await registerResponse.text();
      console.error(`Registration failed with status ${registerResponse.status}`);
      console.error(`Error details: ${errorText}`);
      
      // If it's a 500 error, let's try to get more details
      if (registerResponse.status === 500) {
        console.log('This might be the "Failed to fetch" error we\'re investigating.');
      }
    }
    
    console.log('\nRegistration test completed.');
  } catch (error) {
    console.error('Error during registration test:', error);
  }
}

testRegistration();