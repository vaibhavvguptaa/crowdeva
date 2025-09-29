// Simple script to test if Keycloak realms exist
async function testRealms() {
  const baseUrl = process.env.NEXT_PUBLIC_KEYCLOAK_URL || 'http://localhost:8080';
  const realms = ['master', 'Customer', 'developer', 'vendor'];
  
  console.log('Testing Keycloak realms...\n');
  
  for (const realm of realms) {
    try {
      const url = `${baseUrl}/realms/${realm}/.well-known/openid-configuration`;
      console.log(`Testing realm: ${realm}`);
      
      const response = await fetch(url);
      if (response.ok) {
        console.log(`✅ ${realm} realm is accessible`);
      } else {
        console.log(`❌ ${realm} realm returned ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ ${realm} realm error: ${error.message}`);
    }
  }
  
  console.log('\nIf realms return 404, they need to be created in Keycloak admin console.');
  console.log('1. Go to http://localhost:8080/admin/');
  console.log('2. Login with admin credentials (admin/dev_admin_password_2024!)');
  console.log('3. Create the required realms: Customer, developer, vendor');
  console.log('4. Create clients for each realm with appropriate settings');
}

testRealms();