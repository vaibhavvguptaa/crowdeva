// Script to check if user was created in Keycloak
async function checkUser() {
  try {
    // Get admin token
    const tokenResponse = await fetch('http://localhost:8080/realms/master/protocol/openid-connect/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        username: 'admin',
        password: 'dev_admin_password_2024!',
        grant_type: 'password',
        client_id: 'admin-cli'
      })
    });

    if (!tokenResponse.ok) {
      throw new Error(`Failed to get admin token: ${tokenResponse.status}`);
    }

    const tokenData = await tokenResponse.json();
    const adminToken = tokenData.access_token;
    console.log('Admin token acquired successfully');

    // Search for the user in Customer realm
    console.log('\nSearching for user in Customer realm:');
    const userSearchResponse = await fetch('http://localhost:8080/admin/realms/Customer/users?email=test@example.com', {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      }
    });

    if (userSearchResponse.ok) {
      const users = await userSearchResponse.json();
      console.log('Found users:', users);
    } else {
      console.log('Failed to search for user:', userSearchResponse.status, await userSearchResponse.text());
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

checkUser();