const fs = require('fs');

// Read environment variables from .env.local
if (fs.existsSync('.env.local')) {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  const lines = envContent.split('\n');
  lines.forEach(line => {
    if (line.trim() && !line.startsWith('#')) {
      const [key, value] = line.split('=');
      process.env[key.trim()] = value.trim();
    }
  });
}

async function checkKeycloak() {
  const keycloakUrl = process.env.NEXT_PUBLIC_KEYCLOAK_URL || 'http://localhost:8080';
  const realm = process.env.NEXT_PUBLIC_KEYCLOAK_REALM || 'Customer';
  
  console.log('Checking Keycloak configuration...');
  console.log('Keycloak URL:', keycloakUrl);
  console.log('Realm:', realm);
  
  try {
    // Test if Keycloak is accessible
    console.log('\n1. Testing Keycloak server accessibility...');
    const response = await fetch(keycloakUrl);
    if (response.ok) {
      console.log('✅ Keycloak server is accessible');
    } else {
      console.log('❌ Keycloak server returned status:', response.status);
      console.log('Please make sure Keycloak is running at:', keycloakUrl);
      return;
    }
  } catch (error) {
    console.log('❌ Cannot reach Keycloak server:', error.message);
    console.log('Please make sure Keycloak is running at:', keycloakUrl);
    console.log('\nTo start Keycloak, you can use Docker:');
    console.log('docker run -p 8080:8080 -e KEYCLOAK_ADMIN=admin -e KEYCLOAK_ADMIN_PASSWORD=admin quay.io/keycloak/keycloak:latest start-dev');
    return;
  }
  
  try {
    // Test if realm exists
    console.log('\n2. Testing realm accessibility...');
    const realmUrl = `${keycloakUrl}/realms/${realm}`;
    const response = await fetch(realmUrl);
    if (response.ok) {
      console.log('✅ Realm is accessible');
    } else {
      console.log('❌ Realm is not accessible. Status:', response.status);
      console.log('Please make sure the realm', realm, 'exists in Keycloak');
      return;
    }
  } catch (error) {
    console.log('❌ Cannot access realm:', error.message);
    return;
  }
  
  console.log('\n✅ Keycloak configuration looks good!');
  console.log('Try restarting your Next.js development server and signing in again.');
}

checkKeycloak().catch(console.error);