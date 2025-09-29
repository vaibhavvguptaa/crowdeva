// Test script to verify signup flow with proper cookie handling
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function testSignup() {
  try {
    console.log('Testing signup flow...');
    
    // Create a session to maintain cookies
    const session = await fetch('http://localhost:3000/api/auth/csrf-token', {
      method: 'GET',
      credentials: 'include'
    });
    
    if (!session.ok) {
      throw new Error(`Failed to get CSRF token: ${session.status}`);
    }
    
    const cookies = session.headers.get('set-cookie');
    console.log('Cookies received:', cookies);
    
    const { csrfToken } = await session.json();
    console.log('CSRF token obtained:', csrfToken);
    
    // Test data
    const testData = {
      email: 'test@example.com',
      password: 'TestPassword123!',
      companyName: 'Test Company',
      firstName: 'Test',
      lastName: 'User',
      group: 'customers'
    };
    
    // Attempt to register a new user
    console.log('Attempting to register user...');
    const registerResponse = await fetch('http://localhost:3000/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
        'Cookie': cookies
      },
      body: JSON.stringify(testData)
    });
    
    console.log('Register response status:', registerResponse.status);
    
    if (registerResponse.ok) {
      const result = await registerResponse.json();
      console.log('Registration successful:', result);
    } else {
      const error = await registerResponse.text();
      console.log('Registration failed:', error);
    }
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testSignup();