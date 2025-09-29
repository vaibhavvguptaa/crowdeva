#!/usr/bin/env node
/**
 * Script to create test users in Keycloak
 */

const fetch = require('node-fetch');

// Use localhost when running from host machine
const KEYCLOAK_URL = process.env.KEYCLOAK_HOST || 'http://localhost:8080';
const ADMIN_USER = process.env.KEYCLOAK_ADMIN || 'admin@keycloak.local';
const ADMIN_PASSWORD = process.env.KEYCLOAK_ADMIN_PASSWORD || 'dev_admin_password_2024!';

// Test users for each realm
const TEST_USERS = [
  { 
    realm: 'Customer', 
    users: [
      { username: 'customer@example.com', firstName: 'Customer', lastName: 'User', email: 'customer@example.com', password: 'password123' }
    ] 
  },
  { 
    realm: 'developer', 
    users: [
      { username: 'developer@example.com', firstName: 'Developer', lastName: 'User', email: 'developer@example.com', password: 'password123' }
    ] 
  },
  { 
    realm: 'vendor', 
    users: [
      { username: 'vendor@example.com', firstName: 'Vendor', lastName: 'User', email: 'vendor@example.com', password: 'password123' }
    ] 
  }
];

async function getAdminToken() {
  const url = `${KEYCLOAK_URL}/realms/master/protocol/openid-connect/token`;
  const body = new URLSearchParams({
    grant_type: 'password',
    client_id: 'admin-cli',
    username: ADMIN_USER,
    password: ADMIN_PASSWORD
  });

  console.log(`Getting admin token from ${url}`);
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body
  });

  if (!response.ok) {
    throw new Error(`Failed to get admin token: ${response.status} ${await response.text()}`);
  }

  const data = await response.json();
  console.log('Admin token acquired successfully');
  return data.access_token;
}

async function createUser(token, realm, userData) {
  const url = `${KEYCLOAK_URL}/admin/realms/${realm}/users`;
  const body = {
    username: userData.username,
    firstName: userData.firstName,
    lastName: userData.lastName,
    email: userData.email,
    enabled: true,
    credentials: [
      {
        type: 'password',
        value: userData.password,
        temporary: false
      }
    ]
  };

  console.log(`Creating user ${userData.username} in realm ${realm}`);
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (response.status === 409) {
    console.log(`User ${userData.username} already exists in realm ${realm}`);
    return true;
  }

  if (!response.ok) {
    console.error(`Failed to create user ${userData.username} in realm ${realm}: ${response.status} ${await response.text()}`);
    return false;
  }

  console.log(`Created user ${userData.username} in realm ${realm}`);
  return true;
}

async function main() {
  try {
    console.log('Creating test users in Keycloak...');
    
    // Get admin token
    const token = await getAdminToken();
    
    // Create users in each realm
    for (const realmData of TEST_USERS) {
      console.log(`\nProcessing realm: ${realmData.realm}`);
      for (const user of realmData.users) {
        await createUser(token, realmData.realm, user);
      }
    }
    
    console.log('\nTest users created successfully!');
    console.log('\nTest credentials:');
    console.log('Customer realm: customer@example.com / password123');
    console.log('Developer realm: developer@example.com / password123');
    console.log('Vendor realm: vendor@example.com / password123');
    process.exit(0);
  } catch (error) {
    console.error('Failed to create test users:', error.message);
    process.exit(1);
  }
}

main();