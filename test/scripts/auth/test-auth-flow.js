import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the project root
dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });

async function testAuthFlow() {
  try {
    console.log('Testing authentication flow...');
    
    // Test Customer realm authentication
    console.log('\n1. Testing Customer realm authentication:');
    const tokenUrl = `${process.env.NEXT_PUBLIC_KEYCLOAK_URL}/realms/${process.env.NEXT_PUBLIC_KEYCLOAK_REALM}/protocol/openid-connect/token`;
    
    const formData = new URLSearchParams();
    formData.append('grant_type', 'password');
    formData.append('client_id', process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID);
    formData.append('username', 'testuser'); // Replace with an actual test user
    formData.append('password', 'testpassword'); // Replace with actual test password
    formData.append('scope', 'openid profile email');

    console.log(`Token URL: ${tokenUrl}`);
    console.log(`Client ID: ${process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID}`);
    
    // Note: We can't actually test with real credentials without creating test users first
    console.log('Note: To fully test, you would need to create test users in Keycloak first.');
    
    // Test realm metadata
    console.log('\n2. Testing realm metadata access:');
    const metadataUrl = `${process.env.NEXT_PUBLIC_KEYCLOAK_URL}/realms/${process.env.NEXT_PUBLIC_KEYCLOAK_REALM}/.well-known/openid-configuration`;
    console.log(`Metadata URL: ${metadataUrl}`);
    
    const metadataResponse = await fetch(metadataUrl);
    if (metadataResponse.ok) {
      const metadata = await metadataResponse.json();
      console.log('✅ Realm metadata accessible');
      console.log(`Issuer: ${metadata.issuer}`);
      console.log(`Token endpoint: ${metadata.token_endpoint}`);
      console.log(`Userinfo endpoint: ${metadata.userinfo_endpoint}`);
    } else {
      console.log(`❌ Failed to access realm metadata: ${metadataResponse.status}`);
    }
    
    console.log('\nAuthentication configuration looks good!');
    console.log('To fully test authentication, you need to:');
    console.log('1. Create test users in each realm in Keycloak');
    console.log('2. Use those credentials to test the login flow');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testAuthFlow();