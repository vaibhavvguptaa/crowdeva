// Check Keycloak login status and user authentication
async function checkKeycloakLogin() {
  console.log('🔍 Checking Keycloak Login Status...\n');
  
  // Test 1: Check if Keycloak is accessible
  const baseUrl = (process.env.NEXT_PUBLIC_KEYCLOAK_URL || 'http://localhost:8080').replace(/\/$/, '');
  try {
    const response = await fetch(baseUrl);
    if (response.ok) {
      console.log('✅ Keycloak server is running and accessible');
    } else {
      console.log('❌ Keycloak server issue:', response.status);
      return;
    }
  } catch (error) {
    console.log('❌ Cannot reach Keycloak server:', error.message);
    return;
  }
  
  // Test 2: Check realm accessibility by trying to get OpenID config
  // NOTE: Realms should match Keycloak actual realm names (Customer, developer, vendor)
  const realms = [
    process.env.NEXT_PUBLIC_KEYCLOAK_REALM || 'Customer',
    process.env.NEXT_PUBLIC_KEYCLOAK_DEV_REALM || 'developer',
    process.env.NEXT_PUBLIC_KEYCLOAK_VENDOR_REALM || 'vendor',
    'master'
  ];
  console.log('\n📋 Checking Realm Accessibility:');
  
  for (const realm of realms) {
    try {
  const configUrl = `${baseUrl}/realms/${realm}/.well-known/openid_configuration`;
      const response = await fetch(configUrl);
      
      if (response.ok) {
        const config = await response.json();
        console.log(`✅ ${realm} realm: Accessible`);
        console.log(`   - Issuer: ${config.issuer}`);
        console.log(`   - Token endpoint: ${config.token_endpoint}`);
      } else {
        console.log(`❌ ${realm} realm: Not accessible (${response.status})`);
      }
    } catch (error) {
      console.log(`❌ ${realm} realm: Network error`);
    }
  }
  
  // Test 3: Try authentication with known test users
  console.log('\n🔐 Testing User Authentication:');
  
  const testCredentials = [
    { realm: process.env.NEXT_PUBLIC_KEYCLOAK_REALM || 'Customer', client: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID || 'crowdeval-customer', username: 'test@example.com', password: 'testpassword' },
    { realm: process.env.NEXT_PUBLIC_KEYCLOAK_REALM || 'Customer', client: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID || 'crowdeval-customer', username: 'admin', password: 'admin' },
    { realm: process.env.NEXT_PUBLIC_KEYCLOAK_REALM || 'Customer', client: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID || 'crowdeval-customer', username: 'customer1@company.com', password: 'testpassword' },
    { realm: process.env.NEXT_PUBLIC_KEYCLOAK_DEV_REALM || 'developer', client: process.env.NEXT_PUBLIC_KEYCLOAK_DEV_CLIENT_ID || 'crowdeval-developer', username: 'test@example.com', password: 'testpassword' },
    { realm: process.env.NEXT_PUBLIC_KEYCLOAK_VENDOR_REALM || 'vendor', client: process.env.NEXT_PUBLIC_KEYCLOAK_VENDOR_CLIENT_ID || 'crowdeval-vendor', username: 'test@example.com', password: 'testpassword' }
  ];
  
  for (const cred of testCredentials) {
    await testLogin(cred);
  }
  
  // Test 4: Check admin console accessibility
  console.log('\n👑 Admin Console Access:');
  console.log(`URL: ${baseUrl}/admin/`);
  console.log('Credentials: admin / dev_admin_password_2024!');
  console.log('Use these credentials to manage users and realms');
}

async function testLogin(credentials) {
  const { realm, client, username, password } = credentials;
  
  const baseUrl = (process.env.NEXT_PUBLIC_KEYCLOAK_URL || 'http://localhost:8080').replace(/\/$/, '');
  const tokenUrl = `${baseUrl}/realms/${realm}/protocol/openid-connect/token`;
  const formData = new URLSearchParams();
  formData.append('grant_type', 'password');
  formData.append('client_id', client);
  formData.append('username', username);
  formData.append('password', password);
  formData.append('scope', 'openid profile email');
  
  try {
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData
    });
    
    const result = await response.text();
    
    if (response.ok) {
      const tokens = JSON.parse(result);
      console.log(`✅ ${realm}/${username}: Login successful`);
      console.log(`   - Token type: ${tokens.token_type}`);
      console.log(`   - Expires in: ${tokens.expires_in}s`);
      
      // Test user info endpoint
      await testUserInfo(realm, tokens.access_token, username);
      
    } else {
      try {
        const error = JSON.parse(result);
        console.log(`❌ ${realm}/${username}: ${error.error}`);
        
        if (error.error_description) {
          console.log(`   - Details: ${error.error_description}`);
        }
        
        // Provide specific guidance based on error
        if (error.error === 'invalid_grant') {
          if (error.error_description?.includes('not fully set up')) {
            console.log(`   - 💡 Fix: Complete user setup in admin console`);
          } else if (error.error_description?.includes('Invalid user credentials')) {
            console.log(`   - 💡 Fix: User doesn't exist - create in admin console`);
          }
        }
        
      } catch (e) {
        console.log(`❌ ${realm}/${username}: ${result}`);
      }
    }
    
  } catch (error) {
    console.log(`❌ ${realm}/${username}: Network error - ${error.message}`);
  }
}

async function testUserInfo(realm, accessToken, username) {
  try {
  const baseUrl = (process.env.NEXT_PUBLIC_KEYCLOAK_URL || 'http://localhost:8080').replace(/\/$/, '');
  const userInfoUrl = `${baseUrl}/realms/${realm}/protocol/openid-connect/userinfo`;
    const response = await fetch(userInfoUrl, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    
    if (response.ok) {
      const userInfo = await response.json();
      console.log(`   - User info: ${userInfo.preferred_username || userInfo.sub}`);
      console.log(`   - Email: ${userInfo.email || 'not set'}`);
    }
  } catch (error) {
    console.log(`   - UserInfo error: ${error.message}`);
  }
}

checkKeycloakLogin();
