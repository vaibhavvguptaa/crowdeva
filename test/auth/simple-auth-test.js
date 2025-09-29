// Simple authentication test
async function simpleAuthTest() {
  try {
    console.log('Testing simple authentication flow...');
    
    // Try to get CSRF token first
    console.log('1. Getting CSRF token...');
    const csrfResp = await fetch('http://localhost:3000/api/auth/csrf-token');
    if (!csrfResp.ok) {
      console.error('Failed to get CSRF token:', csrfResp.status);
      return;
    }
    
    const csrfData = await csrfResp.json();
    console.log('CSRF token received:', csrfData.csrfToken ? 'YES' : 'NO');
    
    // Try authentication
    console.log('2. Attempting authentication...');
    const authResp = await fetch('http://localhost:3000/api/auth/location-aware', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfData.csrfToken
      },
      body: JSON.stringify({
        username: 'customer@example.com',
        password: 'password123',
        authType: 'customers'
      })
    });
    
    console.log('Authentication response status:', authResp.status);
    console.log('Response headers:', [...authResp.headers.entries()]);
    
    const authData = await authResp.json();
    console.log('Authentication response:', JSON.stringify(authData, null, 2));
    
  } catch (error) {
    console.error('Error in simple auth test:', error.message);
  }
}

simpleAuthTest();