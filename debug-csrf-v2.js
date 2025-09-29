// Debug script to check CSRF token flow
const debugCSRF = async () => {
  try {
    console.log('Debugging CSRF token flow...');
    
    // First, get CSRF token
    console.log('\n1. Getting CSRF token...');
    const csrfResponse = await fetch('http://localhost:3002/api/auth/csrf-token', {
      method: 'GET',
      credentials: 'include'
    });
    
    console.log('CSRF response status:', csrfResponse.status);
    console.log('CSRF response headers:', [...csrfResponse.headers.entries()]);
    
    if (!csrfResponse.ok) {
      throw new Error(`CSRF token request failed: ${csrfResponse.status}`);
    }
    
    const { csrfToken } = await csrfResponse.json();
    console.log('CSRF token:', csrfToken);
    
    // Check cookies
    const cookies = csrfResponse.headers.get('set-cookie');
    console.log('Set-Cookie header:', cookies);
    
    // Now try to use the token
    console.log('\n2. Using CSRF token...');
    const locationResponse = await fetch('http://localhost:3002/api/auth/location-aware', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken
      },
      body: JSON.stringify({
        username: 'test@example.com',
        password: 'password123',
        authType: 'customers'
      }),
      credentials: 'include'
    });
    
    console.log('Location response status:', locationResponse.status);
    console.log('Location response headers:', [...locationResponse.headers.entries()]);
    
    const responseData = await locationResponse.json();
    console.log('Response data:', responseData);
    
    if (locationResponse.status === 403 && responseData.error && responseData.error.includes('CSRF')) {
      console.log('❌ CSRF validation is failing');
    } else if (locationResponse.status === 401) {
      console.log('✅ CSRF validation passed (got expected 401 for invalid credentials)');
    } else {
      console.log('❓ Unexpected response status:', locationResponse.status);
    }
    
  } catch (error) {
    console.error('Debug test failed:', error.message);
    process.exit(1);
  }
};

debugCSRF();