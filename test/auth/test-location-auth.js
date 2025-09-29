// Script to test location-aware authentication
async function testLocationAuth() {
  try {
    console.log('Testing location-aware authentication...');
    
    const response = await fetch('http://localhost:3000/api/auth/location-aware', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'TestPassword123!',
        authType: 'customers'
      })
    });
    
    console.log(`Authentication response status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Authentication successful!');
      console.log('Response data:', data);
    } else {
      const errorText = await response.text();
      console.error(`Authentication failed: ${response.status}`);
      console.error(`Error details: ${errorText}`);
    }
  } catch (error) {
    console.error('Error during authentication test:', error);
  }
}

testLocationAuth();