// Script to check if groups exist in Keycloak
async function checkGroups() {
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

    // Check groups in Customer realm
    console.log('\nChecking Customer realm groups:');
    const customerGroupsResponse = await fetch('http://localhost:8080/admin/realms/Customer/groups', {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      }
    });

    if (customerGroupsResponse.ok) {
      const groups = await customerGroupsResponse.json();
      console.log('Customer realm groups:', groups);
    } else {
      console.log('Failed to get Customer realm groups:', customerGroupsResponse.status);
    }

    // Check groups in developer realm
    console.log('\nChecking developer realm groups:');
    const developerGroupsResponse = await fetch('http://localhost:8080/admin/realms/developer/groups', {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      }
    });

    if (developerGroupsResponse.ok) {
      const groups = await developerGroupsResponse.json();
      console.log('Developer realm groups:', groups);
    } else {
      console.log('Failed to get developer realm groups:', developerGroupsResponse.status);
    }

    // Check groups in vendor realm
    console.log('\nChecking vendor realm groups:');
    const vendorGroupsResponse = await fetch('http://localhost:8080/admin/realms/vendor/groups', {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      }
    });

    if (vendorGroupsResponse.ok) {
      const groups = await vendorGroupsResponse.json();
      console.log('Vendor realm groups:', groups);
    } else {
      console.log('Failed to get vendor realm groups:', vendorGroupsResponse.status);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

checkGroups();