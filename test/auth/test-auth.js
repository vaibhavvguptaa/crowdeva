// Script to test authentication directly with Keycloak
async function testAuth() {
  try {
    console.log('Testing direct authentication with Keycloak...');
    
    // Test authentication with the user
    const tokenUrl = 'http://localhost:8080/realms/Customer/protocol/openid-connect/token';
    console.log(`Testing token endpoint: ${tokenUrl}`);
    
    const formData = new URLSearchParams();
    formData.append('grant_type', 'password');
    formData.append('client_id', 'customer-web');
    formData.append('username', 'test@example.com');
    formData.append('password', 'TestPassword123!'); // Using a strong password like in the signup test
    
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData
    });
    
    console.log(`Authentication response status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Authentication successful!');
      console.log(`Access token length: ${data.access_token.length}`);
    } else {
      const errorText = await response.text();
      console.error(`Authentication failed: ${response.status}`);
      console.error(`Error details: ${errorText}`);
    }
  } catch (error) {
    console.error('Error during authentication test:', error);
  }
}

testAuth();