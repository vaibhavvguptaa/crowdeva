// Script to check if user is assigned to the correct group
async function checkUserGroups() {
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

    // Get the user ID
    const userSearchResponse = await fetch('http://localhost:8080/admin/realms/Customer/users?email=test@example.com', {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      }
    });

    if (!userSearchResponse.ok) {
      throw new Error('Failed to search for user');
    }

    const users = await userSearchResponse.json();
    if (users.length === 0) {
      throw new Error('User not found');
    }

    const userId = users[0].id;
    console.log('User ID:', userId);

    // Get user's groups
    console.log('\nGetting user groups:');
    const userGroupsResponse = await fetch(`http://localhost:8080/admin/realms/Customer/users/${userId}/groups`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      }
    });

    if (userGroupsResponse.ok) {
      const groups = await userGroupsResponse.json();
      console.log('User groups:', groups);
    } else {
      console.log('Failed to get user groups:', userGroupsResponse.status, await userGroupsResponse.text());
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

checkUserGroups();