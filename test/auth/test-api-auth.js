import fetch from 'node-fetch';

async function testApiAuth() {
  console.log('Testing API authentication endpoint...');
  
  const appUrl = 'http://localhost:3000';
  const authUrl = `${appUrl}/api/auth/location-aware`;
  
  // First get CSRF token
  console.log('Getting CSRF token...');
  const csrfResponse = await fetch(`${appUrl}/api/auth/csrf-token`, {
    method: 'GET',
    credentials: 'include'
  });
  
  if (!csrfResponse.ok) {
    console.error('Failed to get CSRF token');
    return;
  }
  
  const { csrfToken } = await csrfResponse.json();
  console.log('CSRF token received:', csrfToken.substring(0, 10) + '...');
  
  // Now test authentication
  const authData = {
    username: 'customer@example.com',
    password: 'password123',
    authType: 'customers'
  };
  
  console.log(`Testing authentication endpoint: ${authUrl}`);
  
  try {
    const response = await fetch(authUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken
      },
      body: JSON.stringify(authData),
      credentials: 'include'
    });
    
    console.log(`Response status: ${response.status}`);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseData = await response.json();
    console.log('Response data:', JSON.stringify(responseData, null, 2));
    
    if (response.ok) {
      console.log('✅ API authentication successful!');
      return { success: true, data: responseData, csrfToken };
    } else {
      console.error(`❌ API authentication failed: ${response.status}`);
      return { success: false, error: responseData, csrfToken };
    }
  } catch (error) {
    console.error('Error during API authentication test:', error);
    return { success: false, error: error.message, csrfToken };
  }
}

testApiAuth();