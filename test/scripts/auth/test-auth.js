// Test Keycloak authentication directly
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the project root
dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });

async function testAuth() {
  console.log('Testing Keycloak authentication...');
  
  const baseUrl = process.env.NEXT_PUBLIC_KEYCLOAK_URL || 'http://localhost:8080';
  const realm = process.env.NEXT_PUBLIC_KEYCLOAK_REALM || 'Customer';
  const clientId = process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID || 'crowdeval-customer';
  const tokenUrl = `${baseUrl.replace(/\/$/, '')}/realms/${encodeURIComponent(realm)}/protocol/openid-connect/token`;
  
  const formData = new URLSearchParams();
  formData.append('grant_type', 'password');
  formData.append('client_id', clientId);
  formData.append('username', 'test@example.com');  // This user needs to exist
  formData.append('password', 'testpassword');
  formData.append('scope', 'openid profile email');
  
  try {
    console.log(`Testing token endpoint: ${tokenUrl}`);
    console.log('Request body:', formData.toString());
    
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers));
    
    const responseText = await response.text();
    console.log('Response body:', responseText);
    
    if (response.ok) {
      try {
        const tokens = JSON.parse(responseText);
        console.log('✅ Authentication successful!');
        console.log('Access token (first 50 chars):', tokens.access_token?.substring(0, 50) + '...');
        console.log('Token type:', tokens.token_type);
        console.log('Expires in:', tokens.expires_in);
        
        // Test userinfo endpoint
        if (tokens.access_token) {
          await testUserInfo(tokens.access_token);
        }
        
      } catch (e) {
        console.log('✅ Got response but failed to parse JSON:', e.message);
      }
    } else {
      console.log('❌ Authentication failed');
      try {
        const error = JSON.parse(responseText);
        console.log('Error details:', error);
      } catch (e) {
        console.log('Raw error response:', responseText);
      }
    }
    
  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
}

async function testUserInfo(accessToken) {
  const baseUrl = process.env.NEXT_PUBLIC_KEYCLOAK_URL || 'http://localhost:8080';
  const realm = process.env.NEXT_PUBLIC_KEYCLOAK_REALM || 'Customer';
  const userInfoUrl = `${baseUrl.replace(/\/$/, '')}/realms/${encodeURIComponent(realm)}/protocol/openid-connect/userinfo`;
  
  try {
    console.log('\nTesting userinfo endpoint...');
    const response = await fetch(userInfoUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      }
    });
    
    console.log('UserInfo response status:', response.status);
    const userInfo = await response.text();
    console.log('UserInfo response:', userInfo);
    
    if (response.ok) {
      console.log('✅ UserInfo endpoint working');
    } else {
      console.log('❌ UserInfo endpoint failed');
    }
    
  } catch (error) {
    console.error('❌ UserInfo error:', error.message);
  }
}

testAuth();