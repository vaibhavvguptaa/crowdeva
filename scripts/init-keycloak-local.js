#!/usr/bin/env node
/**
 * Script to initialize Keycloak realms and clients for local development
 */

// Load environment variables
require('dotenv').config({ path: '../.env' });

const fetch = require('node-fetch');

console.log('Environment variables:');
console.log('KEYCLOAK_URL:', process.env.KEYCLOAK_URL);
console.log('KEYCLOAK_ADMIN:', process.env.KEYCLOAK_ADMIN);
console.log('KEYCLOAK_ADMIN_PASSWORD:', process.env.KEYCLOAK_ADMIN_PASSWORD ? '****' : 'NOT SET');
console.log('NODE_ENV:', process.env.NODE_ENV);

// Use localhost for local development
const KEYCLOAK_URL = process.env.KEYCLOAK_URL || 'http://localhost:8080';
const ADMIN_USER = process.env.KEYCLOAK_ADMIN || 'admin@keycloak.local';
const ADMIN_PASSWORD = process.env.KEYCLOAK_ADMIN_PASSWORD || 'dev_admin_password_2024!';

console.log('Using Keycloak URL:', KEYCLOAK_URL);
console.log('Using Admin User:', ADMIN_USER);
console.log('Using Admin Password:', ADMIN_PASSWORD ? '****' : 'NOT SET');

// Add a timeout function for fetch requests
const fetchWithTimeout = (url, options, timeout = 10000) => {
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), timeout)
    )
  ]);
};

const REALMS = [
  { name: 'Customer', client: 'customer-web' },
  { name: 'developer', client: 'dev-web' },
  { name: 'vendor', client: 'vendor-web' }
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
  
  // Add retry logic
  let retries = 3;
  while (retries > 0) {
    try {
      const response = await fetchWithTimeout(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body
      }, 15000);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Failed to get admin token: ${response.status} ${errorText}`);
        throw new Error(`Failed to get admin token: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      console.log('Admin token acquired successfully');
      return data.access_token;
    } catch (error) {
      retries--;
      if (retries === 0) {
        throw error;
      }
      console.log(`Retrying... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
}

async function createRealm(token, realmName) {
  const url = `${KEYCLOAK_URL}/admin/realms`;
  const body = {
    realm: realmName,
    enabled: true
  };

  console.log(`Creating realm: ${realmName}`);
  const response = await fetchWithTimeout(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  }, 15000);

  if (response.status === 409) {
    console.log(`Realm ${realmName} already exists, updating...`);
    // Try to update the existing realm
    const updateUrl = `${KEYCLOAK_URL}/admin/realms/${realmName}`;
    const updateResponse = await fetchWithTimeout(updateUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({realm: realmName, enabled: true})
    }, 15000);
    
    if (!updateResponse.ok) {
      console.error(`Failed to update realm ${realmName}: ${updateResponse.status} ${await updateResponse.text()}`);
      return false;
    }
    
    console.log(`Updated realm: ${realmName}`);
    return true;
  }

  if (!response.ok) {
    console.error(`Failed to create realm ${realmName}: ${response.status} ${await response.text()}`);
    return false;
  }

  console.log(`Created realm: ${realmName}`);
  return true;
}

async function createClient(token, realmName, clientId) {
  const url = `${KEYCLOAK_URL}/admin/realms/${realmName}/clients`;
  const body = {
    clientId: clientId,
    name: getClientName(clientId),
    description: getClientDescription(clientId),
    enabled: true,
    clientAuthenticatorType: 'client-secret',
    secret: '**********',
    redirectUris: ['http://localhost:3000/*', 'http://localhost:3001/*'],
    webOrigins: ['+'],
    bearerOnly: false,
    consentRequired: false,
    standardFlowEnabled: true,
    implicitFlowEnabled: false,
    directAccessGrantsEnabled: true,
    serviceAccountsEnabled: false,
    publicClient: true,
    protocol: 'openid-connect',
    attributes: {
      'saml.assertion.signature': 'false',
      'saml.force.post.binding': 'false',
      'saml.multivalued.roles': 'false',
      'saml.encrypt': 'false',
      'saml.server.signature': 'false',
      'saml.server.signature.keyinfo.ext': 'false',
      'exclude.session.state.from.auth.response': 'false',
      'saml_force_name_id_format': 'false',
      'saml.client.signature': 'false',
      'tls.client.certificate.bound.access.tokens': 'false',
      'saml.authnstatement': 'false',
      'display.on.consent.screen': 'false',
      'saml.onetimeuse.condition': 'false'
    }
  };

  console.log(`Creating client ${clientId} in realm ${realmName}`);
  const response = await fetchWithTimeout(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(body)
  }, 15000);

  if (response.status === 409) {
    console.log(`Client ${clientId} already exists in realm ${realmName}`);
    return true;
  }

  if (!response.ok) {
    console.error(`Failed to create client ${clientId} in realm ${realmName}: ${response.status} ${await response.text()}`);
    return false;
  }

  console.log(`Created client ${clientId} in realm ${realmName}`);
  return true;
}

function getClientName(clientId) {
  switch(clientId) {
    case 'customer-web':
      return 'CrowdEval Customer Web Client';
    case 'dev-web':
      return 'CrowdEval Developer Web Client';
    case 'vendor-web':
      return 'CrowdEval Vendor Web Client';
    default:
      return clientId;
  }
}

function getClientDescription(clientId) {
  switch(clientId) {
    case 'customer-web':
      return 'Customer web application client for CrowdEval';
    case 'dev-web':
      return 'Developer web application client for CrowdEval';
    case 'vendor-web':
      return 'Vendor web application client for CrowdEval';
    default:
      return `Client for ${clientId}`;
  }
}

async function createGoogleIdentityProvider(token, realmName) {
  // Skip if Google credentials are not provided
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.log(`Skipping Google identity provider creation for realm ${realmName} - missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET environment variables`);
    return true;
  }

  const url = `${KEYCLOAK_URL}/admin/realms/${realmName}/identity-provider/instances`;
  const body = {
    alias: 'google',
    displayName: 'Google',
    providerId: 'google',
    enabled: true,
    updateProfileFirstLoginMode: 'on',
    trustEmail: true,
    storeToken: false,
    addReadTokenRoleOnCreate: false,
    authenticateByDefault: false,
    linkOnly: false,
    firstBrokerLoginFlowAlias: 'first broker login',
    config: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      defaultScope: 'openid profile email'
    }
  };

  console.log(`Creating Google identity provider in realm ${realmName}`);
  const response = await fetchWithTimeout(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  }, 15000);

  if (response.status === 409) {
    console.log(`Google identity provider already exists in realm ${realmName}`);
    return true;
  }

  if (!response.ok) {
    console.error(`Failed to create Google identity provider in realm ${realmName}: ${response.status} ${await response.text()}`);
    return false;
  }

  console.log(`Created Google identity provider in realm ${realmName}`);
  return true;
}

async function main() {
  try {
    console.log('Initializing Keycloak realms and clients...');
    
    // Get admin token
    const token = await getAdminToken();
    
    // Create realms and clients
    for (const realm of REALMS) {
      await createRealm(token, realm.name);
      await createClient(token, realm.name, realm.client);
      // Add Google identity provider for each realm
      await createGoogleIdentityProvider(token, realm.name);
    }
    
    console.log('Keycloak realms and clients initialized successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Failed to initialize Keycloak:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

main();