// Test Keycloak configuration
async function testKeycloakConfig() {
  console.log('Testing Keycloak configuration...');
  
  const baseUrl = 'http://localhost:8080';
  const realm = process.env.NEXT_PUBLIC_KEYCLOAK_REALM || 'Customer';
  
  try {
    // Test 1: Check if realm's openid configuration is accessible
    const openIdConfigUrl = `${baseUrl}/realms/${realm}/.well-known/openid_configuration`;
    console.log(`Testing: ${openIdConfigUrl}`);
    
    const response = await fetch(openIdConfigUrl);
    if (response.ok) {
      const config = await response.json();
      console.log('✅ Realm accessible');
      console.log('Issuer:', config.issuer);
      console.log('UserInfo endpoint:', config.userinfo_endpoint);
      console.log('Token endpoint:', config.token_endpoint);
    } else {
      console.log('❌ Realm not accessible:', response.status, response.statusText);
      const text = await response.text();
      console.log('Response:', text);
    }
  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
  
  // Test 2: Try with master realm (should work)
  try {
    const masterConfigUrl = `${baseUrl}/realms/master/.well-known/openid_configuration`;
    console.log(`\nTesting master realm: ${masterConfigUrl}`);
    
    const response = await fetch(masterConfigUrl);
    if (response.ok) {
      const config = await response.json();
      console.log('✅ Master realm accessible');
      console.log('Issuer:', config.issuer);
    } else {
      console.log('❌ Master realm not accessible:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('❌ Master realm network error:', error.message);
  }
  
  // Test 3: Check with exact case
  try {
    console.log('\nTesting all known realms...');
    const realms = [
      process.env.NEXT_PUBLIC_KEYCLOAK_REALM || 'Customer',
      process.env.NEXT_PUBLIC_KEYCLOAK_DEV_REALM || 'developer',
      process.env.NEXT_PUBLIC_KEYCLOAK_VENDOR_REALM || 'vendor',
      'master'
    ];
    
    for (const testRealm of realms) {
      const testUrl = `${baseUrl}/realms/${testRealm}/.well-known/openid_configuration`;
      console.log(`Testing ${testRealm}...`);
      
      try {
        const response = await fetch(testUrl);
        if (response.ok) {
          console.log(`✅ ${testRealm} is accessible`);
        } else {
          console.log(`❌ ${testRealm} returned ${response.status}`);
        }
      } catch (err) {
        console.log(`❌ ${testRealm} network error: ${err.message}`);
      }
    }
  } catch (error) {
    console.error('❌ Realm testing error:', error.message);
  }
}

testKeycloakConfig();
