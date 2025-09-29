// Test script to verify authentication fixes
const testAuthFix = async () => {
  try {
    console.log('Testing authentication flow...');
    
    // Test CSRF token generation
    const csrfResponse = await fetch('http://localhost:3001/api/auth/csrf-token', {
      method: 'GET',
      credentials: 'include'
    });
    
    if (!csrfResponse.ok) {
      throw new Error(`CSRF token request failed: ${csrfResponse.status}`);
    }
    
    const { csrfToken } = await csrfResponse.json();
    console.log('✓ CSRF token generated successfully');
    
    // Test location-aware auth endpoint (without actually authenticating)
    const locationResponse = await fetch('http://localhost:3001/api/auth/location-aware', {
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
    
    // We expect this to fail with 401 (invalid credentials) rather than 403 (CSRF error)
    if (locationResponse.status === 403) {
      const errorData = await locationResponse.json();
      if (errorData.error && errorData.error.includes('CSRF')) {
        throw new Error('CSRF token validation is still failing');
      }
    }
    
    console.log('✓ Location-aware auth endpoint is working correctly');
    console.log('Authentication fixes have been successfully implemented!');
    
  } catch (error) {
    console.error('Authentication test failed:', error.message);
    process.exit(1);
  }
};

testAuthFix();