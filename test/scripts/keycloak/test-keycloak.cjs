const fetch = require('node-fetch');

async function testKeycloakAdminToken() {
  try {
    const keycloakUrl = 'http://localhost:8080';
    const adminUsername = 'admin@keycloak.local';
    const adminPassword = 'dev_admin_password_2024!';

    console.log('Testing Keycloak admin token acquisition...');
    console.log('Keycloak URL:', keycloakUrl);
    console.log('Admin username:', adminUsername);

    const tokenEndpoint = `${keycloakUrl}/realms/master/protocol/openid-connect/token`;
    
    const formData = new URLSearchParams();
    formData.append('grant_type', 'password');
    formData.append('client_id', 'admin-cli');
    formData.append('username', adminUsername);
    formData.append('password', adminPassword);

    console.log('Making request to:', tokenEndpoint);
    
    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    });

    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to get admin token:', response.status, errorText);
      return null;
    }

    const tokenData = await response.json();
    console.log('Admin token acquired successfully');
    console.log('Token data:', Object.keys(tokenData));
    return tokenData.access_token;
  } catch (error) {
    console.error('Error getting admin token:', error);
    return null;
  }
}

testKeycloakAdminToken().then(token => {
  if (token) {
    console.log('SUCCESS: Keycloak admin token acquired');
  } else {
    console.log('FAILURE: Could not acquire Keycloak admin token');
  }
});