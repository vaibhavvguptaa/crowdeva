import fetch from 'node-fetch';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

async function testKeycloakConnection() {
  // Use environment variables with fallbacks
  const keycloakUrl = process.env.NEXT_PUBLIC_KEYCLOAK_URL || process.env.KEYCLOAK_URL || 'http://localhost:8080';
  const realm = process.env.NEXT_PUBLIC_KEYCLOAK_REALM || process.env.KEYCLOAK_REALM || 'Customer';
  const clientId = process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID || process.env.KEYCLOAK_CLIENT_ID || 'customer-web';
  const adminUser = process.env.KEYCLOAK_ADMIN_USER || 'admin';
  const adminPassword = process.env.KEYCLOAK_ADMIN_PASSWORD || 'dev_admin_password_2024!';
  
  console.log('Testing Keycloak Connection...');
  console.log('Keycloak URL:', keycloakUrl);
  console.log('Realm:', realm);
  console.log('Client ID:', clientId);
  console.log('Admin User:', adminUser);
  
  if (!keycloakUrl) {
    console.error('KEYCLOAK_URL or NEXT_PUBLIC_KEYCLOAK_URL is not set in .env.local');
    return;
  }
  
  try {
    // Test 1: Check if Keycloak server is accessible
    console.log('\n1. Testing Keycloak server accessibility...');
    const serverResponse = await fetch(keycloakUrl, { 
      method: 'HEAD',
      timeout: 5000
    });
    console.log('✅ Keycloak server is accessible:', serverResponse.status);
    
    // Test 2: Test realm configuration endpoint (well-known configuration)
    console.log('\n2. Testing realm configuration endpoint...');
    const configUrl = `${keycloakUrl}/realms/${realm}/.well-known/openid-configuration`;
    console.log('Testing realm configuration endpoint:', configUrl);
    
    const configResponse = await fetch(configUrl);
    console.log('Realm configuration response:', configResponse.status);
    
    if (configResponse.ok) {
      const configData = await configResponse.json();
      console.log('✅ Well-known configuration retrieved successfully');
      console.log(`Token endpoint: ${configData.token_endpoint}`);
    } else {
      console.log('❌ Realm configuration error:', configResponse.status);
      const errorText = await configResponse.text();
      console.error(`Error details: ${errorText}`);
      return; // Stop here if configuration is not accessible
    }
    
    // Test 3: Check if we can get an admin token
    console.log('\n3. Testing admin token acquisition...');
    const adminTokenUrl = `${keycloakUrl}/realms/master/protocol/openid-connect/token`;
    console.log(`Testing admin token endpoint: ${adminTokenUrl}`);
    
    const adminFormData = new URLSearchParams();
    adminFormData.append('grant_type', 'password');
    adminFormData.append('client_id', 'admin-cli');
    adminFormData.append('username', adminUser);
    adminFormData.append('password', adminPassword);
    
    const adminTokenResponse = await fetch(adminTokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: adminFormData
    });
    
    console.log(`Admin token response status: ${adminTokenResponse.status}`);
    
    if (adminTokenResponse.ok) {
      const adminTokenData = await adminTokenResponse.json();
      console.log('✅ Admin token acquired successfully');
      console.log(`Access token length: ${adminTokenData.access_token.length}`);
    } else {
      console.log('❌ Failed to acquire admin token:', adminTokenResponse.status);
      const errorText = await adminTokenResponse.text();
      console.error(`Error details: ${errorText}`);
    }
    
    console.log('\n✅ Keycloak connection test completed.');
  } catch (error) {
    console.error('❌ Keycloak connection test failed:', error.message);
    console.error('Error stack:', error.stack);
  }
}

testKeycloakConnection();