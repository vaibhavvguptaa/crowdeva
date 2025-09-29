// Script to test double authentication issue
// Note: This script can't directly import the Keycloak service because it's a client-side module
// We'll just test the location-aware authentication part

async function testDoubleAuth() {
  try {
    console.log('Testing location-aware authentication...');
    
    // First, test location-aware authentication
    const locationResponse = await fetch('http://localhost:3000/api/auth/location-aware', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'TestPassword123!',
        authType: 'customers'
      })
    });
    
    console.log(`Location-aware authentication response status: ${locationResponse.status}`);
    
    if (!locationResponse.ok) {
      const errorText = await locationResponse.text();
      console.error(`Location-aware authentication failed: ${locationResponse.status}`);
      console.error(`Error details: ${errorText}`);
      return;
    }
    
    const locationData = await locationResponse.json();
    console.log('Location-aware authentication successful!');
    console.log('Location data:', locationData);
    
    console.log('\nNote: We cannot test DirectGrantAuth directly from this script because it is a client-side module.');
    console.log('However, the issue is likely that the frontend is trying to authenticate twice:');
    console.log('1. First through the location-aware API (successful)');
    console.log('2. Then through DirectGrantAuth.login (possibly failing)');
  } catch (error) {
    console.error('Error during double authentication test:', error);
  }
}

testDoubleAuth();