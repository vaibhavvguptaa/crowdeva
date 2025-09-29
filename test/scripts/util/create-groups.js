// Script to create groups in Keycloak
async function createGroups() {
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

    // Create groups in Customer realm
    console.log('\nCreating groups in Customer realm:');
    const customerGroupResponse = await fetch('http://localhost:8080/admin/realms/Customer/groups', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: 'customers' })
    });

    if (customerGroupResponse.ok) {
      console.log('Customer group created successfully');
    } else {
      console.log('Failed to create Customer group:', customerGroupResponse.status, await customerGroupResponse.text());
    }

    // Create groups in developer realm
    console.log('\nCreating groups in developer realm:');
    const developerGroupResponse = await fetch('http://localhost:8080/admin/realms/developer/groups', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: 'developers' })
    });

    if (developerGroupResponse.ok) {
      console.log('Developer group created successfully');
    } else {
      console.log('Failed to create Developer group:', developerGroupResponse.status, await developerGroupResponse.text());
    }

    // Create groups in vendor realm
    console.log('\nCreating groups in vendor realm:');
    const vendorGroupResponse = await fetch('http://localhost:8080/admin/realms/vendor/groups', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: 'vendors' })
    });

    if (vendorGroupResponse.ok) {
      console.log('Vendor group created successfully');
    } else {
      console.log('Failed to create Vendor group:', vendorGroupResponse.status, await vendorGroupResponse.text());
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

createGroups();