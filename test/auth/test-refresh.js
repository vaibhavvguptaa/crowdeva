import fetch from 'node-fetch';
import * as fs from 'fs';

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
  formData.append('scope', 'openid profile email offline_access');
  
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
      if (data.refresh_token) {
        console.log(`Refresh token length: ${data.refresh_token.length}`);
      }
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

async function testRefreshToken(accessToken, refreshToken) {
  console.log('\nTesting refresh token flow...');
  
  const baseUrl = 'http://localhost:8080';
  const realm = 'Customer';
  const clientId = 'customer-web';
  const tokenUrl = `${baseUrl}/realms/${realm}/protocol/openid-connect/token`;
  
  const formData = new URLSearchParams();
  formData.append('grant_type', 'refresh_token');
  formData.append('refresh_token', refreshToken);
  formData.append('client_id', clientId);
  
  try {
    console.log(`Testing refresh token endpoint: ${tokenUrl}`);
    
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData
    });
    
    console.log(`Refresh response status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Token refresh successful!');
      console.log(`New access token length: ${data.access_token.length}`);
      console.log(`New refresh token exists: ${!!data.refresh_token}`);
      if (data.refresh_token) {
        console.log(`New refresh token length: ${data.refresh_token.length}`);
      }
      return data;
    } else {
      const errorText = await response.text();
      console.error(`❌ Token refresh failed: ${response.status}`);
      console.error(`Error details: ${errorText}`);
      return null;
    }
  } catch (error) {
    console.error('Error during token refresh test:', error);
    return null;
  }
}

// Run the tests
async function runTests() {
  const authData = await testLogin();
  if (authData && authData.refresh_token) {
    await testRefreshToken(authData.access_token, authData.refresh_token);
  }
}

runTests();