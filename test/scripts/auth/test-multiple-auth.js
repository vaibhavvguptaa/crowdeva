// Test with different usernames that might exist
async function testMultipleUsers() {
  console.log('Testing multiple user scenarios...');
  
  const baseUrl = process.env.NEXT_PUBLIC_KEYCLOAK_URL || 'http://localhost:8080';
  const realm = process.env.NEXT_PUBLIC_KEYCLOAK_REALM || 'Customer';
  const clientId = process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID || 'crowdeval-customer';
  const tokenUrl = `${baseUrl.replace(/\/$/, '')}/realms/${encodeURIComponent(realm)}/protocol/openid-connect/token`;
  
  // Test users based on what we saw in logs
  const testUsers = [
    { username: 'customer1@company.com', password: 'testpassword' },
    { username: 'test@example.com', password: 'testpassword' },
    { username: 'testuser', password: 'testpassword' },
    { username: 'admin', password: 'admin' },
  ];
  
  for (const user of testUsers) {
    console.log(`\n--- Testing user: ${user.username} ---`);
    
    const formData = new URLSearchParams();
    formData.append('grant_type', 'password');
  formData.append('client_id', clientId);
    formData.append('username', user.username);
    formData.append('password', user.password);
    formData.append('scope', 'openid profile email');
    
    try {
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData
      });
      
      const responseText = await response.text();
      console.log('Status:', response.status);
      
      if (response.ok) {
        const tokens = JSON.parse(responseText);
        console.log('✅ SUCCESS! Got tokens for', user.username);
        console.log('Access token preview:', tokens.access_token?.substring(0, 50) + '...');
        return; // Stop on first success
      } else {
        try {
          const error = JSON.parse(responseText);
          console.log('❌ Error:', error.error, '-', error.error_description);
        } catch (e) {
          console.log('❌ Raw error:', responseText);
        }
      }
      
    } catch (error) {
      console.error('❌ Network error:', error.message);
    }
  }
  
  console.log('\n--- Testing client configuration ---');
  await testClientConfig();
}

async function testClientConfig() {
  // Test if client requires authentication
  const baseUrl = process.env.NEXT_PUBLIC_KEYCLOAK_URL || 'http://localhost:8080';
  const realm = process.env.NEXT_PUBLIC_KEYCLOAK_REALM || 'Customer';
  const clientId = process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID || 'crowdeval-customer';
  const tokenUrl = `${baseUrl.replace(/\/$/, '')}/realms/${encodeURIComponent(realm)}/protocol/openid-connect/token`;
  
  const formData = new URLSearchParams();
  formData.append('grant_type', 'client_credentials');
  formData.append('client_id', clientId);
  formData.append('scope', 'openid');
  
  try {
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData
    });
    
    const responseText = await response.text();
    console.log('Client credentials test status:', response.status);
    
    if (response.ok) {
      console.log('✅ Client credentials flow works');
    } else {
      try {
        const error = JSON.parse(responseText);
        console.log('Client error:', error.error, '-', error.error_description);
      } catch (e) {
        console.log('Raw client error:', responseText);
      }
    }
    
  } catch (error) {
    console.error('Client test error:', error.message);
  }
}

testMultipleUsers();
