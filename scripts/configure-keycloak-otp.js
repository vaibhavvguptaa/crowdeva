#!/usr/bin/env node
/**
 * Script: configure-keycloak-otp.js
 * Purpose: Automate realm/client OTP + brute force configuration for local dev Keycloak (running in docker-compose).
 * Usage:  node scripts/configure-keycloak-otp.js
 * Env (optional):
 *   KC_BASE_URL (default http://localhost:8080)
 *   KC_ADMIN_USER (default admin)
 *   KC_ADMIN_PASS (default dev_admin_password_2024!)
 *   REALMS (comma separated list) default: customer,developer,vendor
 *   CLIENT_ID (OIDC client that must have direct access grants enabled) default: crowd-client
 */

const fetch = global.fetch || (await import('node-fetch')).default; // Node 18 has fetch

const BASE_URL = process.env.KC_BASE_URL || 'http://localhost:8080';
const ADMIN_USER = process.env.KC_ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.KC_ADMIN_PASS || 'dev_admin_password_2024!';

// Gather realm names from multiple potential sources (explicit REALMS env takes precedence)
const ENV_REALM_LIST = (process.env.REALMS || '')
  .split(',')
  .map(r => r.trim())
  .filter(Boolean);

const REALMS_FROM_PUBLIC_ENV = [
  process.env.NEXT_PUBLIC_KEYCLOAK_REALM,
  process.env.NEXT_PUBLIC_KEYCLOAK_DEV_REALM,
  process.env.NEXT_PUBLIC_KEYCLOAK_VENDOR_REALM
].filter(Boolean);

// Default fallback now uses 'Customer' (capitalized) to match actual Keycloak realm naming.
const REALMS = (ENV_REALM_LIST.length ? ENV_REALM_LIST : (REALMS_FROM_PUBLIC_ENV.length ? REALMS_FROM_PUBLIC_ENV : ['Customer','developer','vendor']))
  .map(r => r.trim())
  .filter((v, i, a) => v && a.indexOf(v) === i);

// Allow per‑realm client overrides; fallback to generic single client id
const CLIENT_ID = process.env.CLIENT_ID || 'crowd-client';
const DEV_CLIENT_ID = process.env.NEXT_PUBLIC_KEYCLOAK_DEV_CLIENT_ID || 'dev-web';
const VENDOR_CLIENT_ID = process.env.NEXT_PUBLIC_KEYCLOAK_VENDOR_CLIENT_ID || 'vendor-web';
const CUSTOMER_CLIENT_ID = process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID || 'customer-web';

async function getAdminToken() {
  const url = `${BASE_URL}/realms/master/protocol/openid-connect/token`;
  const body = new URLSearchParams({
    grant_type: 'password',
    client_id: 'admin-cli',
    username: ADMIN_USER,
    password: ADMIN_PASS
  });
  const res = await fetch(url, { method: 'POST', body, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
  if (!res.ok) throw new Error(`Admin token failed: ${res.status} ${res.statusText}`);
  return (await res.json()).access_token;
}

async function updateRealm(token, realm) {
  const url = `${BASE_URL}/admin/realms/${encodeURIComponent(realm)}`;
  const get = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (get.status === 404) {
    console.warn(`[WARN] Realm '${realm}' not found (404) — skipping.`);
    return null;
  }
  if (!get.ok) throw new Error(`Fetch realm ${realm} failed: ${get.status}`);
  const current = await get.json();

  const desired = {
    ...current,
    otpPolicyType: 'totp',
    otpPolicyAlgorithm: current.otpPolicyAlgorithm || 'HmacSHA1',
    otpPolicyDigits: 6,
    otpPolicyPeriod: 30,
    otpPolicyLookAheadWindow: current.otpPolicyLookAheadWindow ?? 1,
    bruteForceProtected: true,
    failureFactor: current.failureFactor || 5,
    maxFailureWaitSeconds: current.maxFailureWaitSeconds || 900,
    permanentLockout: false,
    quickLoginCheckMilliSeconds: current.quickLoginCheckMilliSeconds || 1000
  };

  const put = await fetch(url, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(desired) });
  if (!put.ok) throw new Error(`Update realm ${realm} failed: ${put.status}`);
  return realm;
}

async function enableDirectGrant(token, realm) {
  // Pick realm-specific client id if provided
  let cid = CUSTOMER_CLIENT_ID; // default to customer client id
  if (/dev/i.test(realm)) cid = DEV_CLIENT_ID;
  else if (/vendor/i.test(realm)) cid = VENDOR_CLIENT_ID;
  else if (/customer/i.test(realm)) cid = CUSTOMER_CLIENT_ID;

  const listUrl = `${BASE_URL}/admin/realms/${realm}/clients?clientId=${encodeURIComponent(cid)}`;
  const res = await fetch(listUrl, { headers: { Authorization: `Bearer ${token}` } });
  if (res.status === 404) {
    console.warn(`[WARN] Realm '${realm}' disappeared before client lookup — skipping direct grant enable.`);
    return;
  }
  if (!res.ok) throw new Error(`List clients failed ${realm}: ${res.status}`);
  const arr = await res.json();
  if (!arr.length) {
    console.warn(`[WARN] Client ${cid} not found in realm ${realm}. Creating it...`);
    // Create the client if it doesn't exist
    await createClient(token, realm, cid);
    return;
  }
  const client = arr[0];
  if (client.directAccessGrantsEnabled) return; // already
  client.directAccessGrantsEnabled = true;
  const updateUrl = `${BASE_URL}/admin/realms/${realm}/clients/${client.id}`;
  const upd = await fetch(updateUrl, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(client) });
  if (!upd.ok) throw new Error(`Enable direct grant failed ${realm}: ${upd.status}`);
}

// New function to create a client
async function createClient(token, realm, clientId) {
  const createUrl = `${BASE_URL}/admin/realms/${realm}/clients`;
  const clientConfig = {
    clientId: clientId,
    enabled: true,
    publicClient: true,
    directAccessGrantsEnabled: true,
    redirectUris: ['http://localhost:3000/*'],
    webOrigins: ['+']
  };
  
  const res = await fetch(createUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(clientConfig)
  });
  
  if (!res.ok) {
    throw new Error(`Failed to create client ${clientId} in realm ${realm}: ${res.status} ${await res.text()}`);
  }
  
  console.log(`[✓] Created client ${clientId} in realm ${realm}`);
}

async function listAllRealms(token) {
  try {
    const res = await fetch(`${BASE_URL}/admin/realms`, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

(async () => {
  try {
    console.log('[*] Obtaining admin token...');
    const token = await getAdminToken();
    const available = await listAllRealms(token);
    const availableNames = new Set(available.map(r => r.realm));
    console.log(`[i] Candidate realms: ${REALMS.join(', ')} (available on server: ${[...availableNames].join(', ')})`);

    let configuredCount = 0;
    for (const realm of REALMS) {
      if (!availableNames.has(realm)) {
        console.warn(`[WARN] Skipping '${realm}' (not present on server).`);
        continue;
      }
      console.log(`[*] Configuring realm ${realm}...`);
      const updated = await updateRealm(token, realm);
      if (!updated) continue;
      await enableDirectGrant(token, realm);
      console.log(`[✓] Realm ${realm} updated.`);
      configuredCount++;
    }
    if (configuredCount === 0) {
      console.error('[ERROR] No matching realms were configured. Verify environment variables or pass REALMS=realm1,realm2');
      process.exit(2);
    }
    console.log('[✓] All done.');
  } catch (e) {
    console.error('[ERROR]', e.message);
    process.exit(1);
  }
})();
