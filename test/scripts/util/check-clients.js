import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function checkClients(realmName) {
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
        client_id: 'admin-cli',
      }),
    });

    if (!tokenResponse.ok) {
      console.error('Failed to get admin token:', tokenResponse.status, await tokenResponse.text());
      return;
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    console.log(`Checking clients in realm: ${realmName}`);

    // List clients in the realm
    const clientsResponse = await fetch(`http://localhost:8080/admin/realms/${realmName}/clients`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!clientsResponse.ok) {
      console.error(`Failed to list clients in realm ${realmName}:`, clientsResponse.status, await clientsResponse.text());
      return;
    }

    const clients = await clientsResponse.json();
    console.log(`Available clients in ${realmName}:`);
    clients.forEach(client => {
      console.log(`- ${client.clientId} (id: ${client.id})`);
    });

  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Check clients in each realm
checkClients('Customer');
checkClients('developer');
checkClients('vendor');