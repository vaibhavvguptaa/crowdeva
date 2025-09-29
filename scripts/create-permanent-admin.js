#!/usr/bin/env node
/**
 * Script to create a permanent admin account in Keycloak
 * This resolves the "temporary admin user" warning by creating a dedicated admin account
 */

const fetch = require('node-fetch');

// Configuration - use environment variables or defaults
const KEYCLOAK_URL = process.env.KEYCLOAK_HOST || process.env.KEYCLOAK_URL || 'http://localhost:8080';
const TEMP_ADMIN_USER = process.env.KEYCLOAK_ADMIN || 'admin';
const TEMP_ADMIN_PASSWORD = process.env.KEYCLOAK_ADMIN_PASSWORD || 'dev_admin_password_2024!';

// Permanent admin account details
const PERMANENT_ADMIN_USERNAME = process.env.PERMANENT_ADMIN_USERNAME || 'keycloak-admin';
const PERMANENT_ADMIN_EMAIL = process.env.PERMANENT_ADMIN_EMAIL || 'admin@keycloak.local';
const PERMANENT_ADMIN_PASSWORD = process.env.PERMANENT_ADMIN_PASSWORD || process.env.KEYCLOAK_ADMIN_PASSWORD || 'dev_admin_password_2024!';

/**
 * Get admin token using temporary admin credentials
 */
async function getTempAdminToken() {
  const url = `${KEYCLOAK_URL}/realms/master/protocol/openid-connect/token`;
  const body = new URLSearchParams({
    grant_type: 'password',
    client_id: 'admin-cli',
    username: TEMP_ADMIN_USER,
    password: TEMP_ADMIN_PASSWORD
  });

  console.log(`Getting temporary admin token from ${url}`);
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body
  });

  if (!response.ok) {
    throw new Error(`Failed to get temporary admin token: ${response.status} ${await response.text()}`);
  }

  const data = await response.json();
  console.log('Temporary admin token acquired successfully');
  return data.access_token;
}

/**
 * Create a new permanent admin user
 */
async function createPermanentAdmin(token) {
  const url = `${KEYCLOAK_URL}/admin/realms/master/users`;
  const body = {
    username: PERMANENT_ADMIN_USERNAME,
    email: PERMANENT_ADMIN_EMAIL,
    firstName: 'Keycloak',
    lastName: 'Administrator',
    enabled: true,
    emailVerified: true,
    credentials: [
      {
        type: 'password',
        value: PERMANENT_ADMIN_PASSWORD,
        temporary: false
      }
    ]
  };

  console.log(`Creating permanent admin user: ${PERMANENT_ADMIN_USERNAME}`);
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (response.status === 409) {
    console.log(`Permanent admin user ${PERMANENT_ADMIN_USERNAME} already exists`);
    return true;
  }

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Failed to create permanent admin user: ${response.status} ${errorText}`);
    
    // If it's a conflict due to username/email already existing, we can continue
    if (response.status === 409) {
      console.log(`User already exists, continuing...`);
      return true;
    }
    
    return false;
  }

  console.log(`Created permanent admin user: ${PERMANENT_ADMIN_USERNAME}`);
  return true;
}

/**
 * Assign admin roles to the permanent admin user
 */
async function assignAdminRoles(token) {
  // First, get the user ID of our permanent admin
  const searchUrl = `${KEYCLOAK_URL}/admin/realms/master/users?username=${encodeURIComponent(PERMANENT_ADMIN_USERNAME)}`;
  const searchResponse = await fetch(searchUrl, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!searchResponse.ok) {
    console.error(`Failed to search for admin user: ${searchResponse.status} ${await searchResponse.text()}`);
    return false;
  }

  const users = await searchResponse.json();
  if (!users || users.length === 0) {
    console.error(`Could not find user ${PERMANENT_ADMIN_USERNAME}`);
    return false;
  }

  const userId = users[0].id;
  console.log(`Found user ID for ${PERMANENT_ADMIN_USERNAME}: ${userId}`);

  // Get available roles
  const rolesUrl = `${KEYCLOAK_URL}/admin/realms/master/users/${userId}/role-mappings/realm/available`;
  const rolesResponse = await fetch(rolesUrl, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!rolesResponse.ok) {
    console.error(`Failed to get available roles: ${rolesResponse.status} ${await rolesResponse.text()}`);
    return false;
  }

  const availableRoles = await rolesResponse.json();
  const adminRole = availableRoles.find(role => role.name === 'admin');
  
  // If we can't find the role in available roles, the user might already have it
  if (!adminRole) {
    console.log('Admin role not found in available roles - checking if user already has it');
    
    // Check what roles the user currently has
    const userRolesUrl = `${KEYCLOAK_URL}/admin/realms/master/users/${userId}/role-mappings/realm`;
    const userRolesResponse = await fetch(userRolesUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (userRolesResponse.ok) {
      const userRoles = await userRolesResponse.json();
      const hasAdminRole = userRoles.find(role => role.name === 'admin');
      
      if (hasAdminRole) {
        console.log(`User ${PERMANENT_ADMIN_USERNAME} already has admin role`);
        return true;
      } else {
        console.error('Could not find admin role and user does not have it assigned');
        return false;
      }
    } else {
      console.error('Could not check user roles:', await userRolesResponse.text());
      return false;
    }
  }

  // Assign admin role to the user
  const assignUrl = `${KEYCLOAK_URL}/admin/realms/master/users/${userId}/role-mappings/realm`;
  const assignResponse = await fetch(assignUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify([adminRole])
  });

  if (!assignResponse.ok) {
    // Check if the role is already assigned (409 Conflict)
    if (assignResponse.status === 409) {
      console.log(`Admin role already assigned to user ${PERMANENT_ADMIN_USERNAME}`);
      return true;
    }
    console.error(`Failed to assign admin role: ${assignResponse.status} ${await assignResponse.text()}`);
    return false;
  }

  console.log(`Assigned admin role to user ${PERMANENT_ADMIN_USERNAME}`);
  return true;
}

/**
 * Test the new admin account
 */
async function testNewAdminAccount() {
  const url = `${KEYCLOAK_URL}/realms/master/protocol/openid-connect/token`;
  const body = new URLSearchParams({
    grant_type: 'password',
    client_id: 'admin-cli',
    username: PERMANENT_ADMIN_USERNAME,
    password: PERMANENT_ADMIN_PASSWORD
  });

  console.log(`Testing new admin account authentication...`);
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body
  });

  if (!response.ok) {
    console.error(`Failed to authenticate with new admin account: ${response.status} ${await response.text()}`);
    return false;
  }

  const data = await response.json();
  console.log('New admin account authenticated successfully');
  return true;
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('Creating permanent admin account in Keycloak...');
    console.log(`Keycloak URL: ${KEYCLOAK_URL}`);
    console.log(`New admin username: ${PERMANENT_ADMIN_USERNAME}`);
    console.log(`New admin email: ${PERMANENT_ADMIN_EMAIL}`);
    
    // Get token with temporary admin
    const tempToken = await getTempAdminToken();
    
    // Create permanent admin user
    const userCreated = await createPermanentAdmin(tempToken);
    if (!userCreated) {
      throw new Error('Failed to create permanent admin user');
    }
    
    // Assign admin roles
    const rolesAssigned = await assignAdminRoles(tempToken);
    if (!rolesAssigned) {
      throw new Error('Failed to assign admin roles');
    }
    
    // Test new admin account
    const accountWorks = await testNewAdminAccount();
    if (!accountWorks) {
      throw new Error('Failed to authenticate with new admin account');
    }
    
    console.log('\nPermanent admin account created successfully!');
    console.log('You can now log in to Keycloak with these credentials:');
    console.log(`Username: ${PERMANENT_ADMIN_USERNAME}`);
    console.log(`Password: ${PERMANENT_ADMIN_PASSWORD}`);
    console.log('\nFor security, consider disabling the temporary admin account in the Keycloak admin console.');
    
    process.exit(0);
  } catch (error) {
    console.error('Failed to create permanent admin account:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  createPermanentAdmin,
  assignAdminRoles,
  testNewAdminAccount,
  getTempAdminToken
};