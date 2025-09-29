import fetch from 'node-fetch';

async function testLogin() {
  console.log('Testing login with correct credentials...');
  
  const baseUrl = 'http://localhost:8080';
  const realm = 'Customer';
  const clientId = 'customer-web';
  const tokenUrl = `${baseUrl}/realms/${realm}/protocol/openid-connect/token`;
  
  const formData = new URLSearchParams();
  formData.append('grant_type', 'password');
  formData.append('client_id', clientId);
  formData.append('username', 'customer@example.com');
  formData.append('password', 'password123');
  formData.append('scope', 'openid profile email');
  
  try {
    console.log(`Testing token endpoint: ${tokenUrl}`);
    
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData
    });
    
    console.log(`Response status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Authentication successful!');
      console.log(`Access token length: ${data.access_token.length}`);
      console.log(`Refresh token exists: ${!!data.refresh_token}`);
      return data;
    } else {
      const errorText = await response.text();
      console.error(`❌ Authentication failed: ${response.status}`);
      console.error(`Error details: ${errorText}`);
      return null;
    }
  } catch (error) {
    console.error('Error during authentication test:', error);
    return null;
  }
}

testLogin();