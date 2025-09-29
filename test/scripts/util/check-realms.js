import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function checkRealms() {
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

    console.log('Admin token obtained successfully');

    // List realms
    const realmsResponse = await fetch('http://localhost:8080/admin/realms', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!realmsResponse.ok) {
      console.error('Failed to list realms:', realmsResponse.status, await realmsResponse.text());
      return;
    }

    const realms = await realmsResponse.json();
    console.log('Available realms:');
    realms.forEach(realm => {
      console.log(`- ${realm.realm} (id: ${realm.id})`);
    });

  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkRealms();