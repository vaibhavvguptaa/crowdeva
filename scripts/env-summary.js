#!/usr/bin/env node
// Quick environment summary for Keycloak-related vars.
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const keys = [
  'NEXT_PUBLIC_KEYCLOAK_URL',
  'NEXT_PUBLIC_KEYCLOAK_REALM',
  'NEXT_PUBLIC_KEYCLOAK_CLIENT_ID',
  'NEXT_PUBLIC_KEYCLOAK_DEV_REALM',
  'NEXT_PUBLIC_KEYCLOAK_DEV_CLIENT_ID',
  'NEXT_PUBLIC_KEYCLOAK_VENDOR_REALM',
  'NEXT_PUBLIC_KEYCLOAK_VENDOR_CLIENT_ID',
  'KEYCLOAK_ADMIN',
  'KEYCLOAK_ADMIN_PASSWORD',
  'KEYCLOAK_REQUIRE_TOTP'
];

const red = s => `\x1b[31m${s}\x1b[0m`;
const yellow = s => `\x1b[33m${s}\x1b[0m`;
const green = s => `\x1b[32m${s}\x1b[0m`;

let missing = 0;
console.log('\nEnvironment summary:');
for (const k of keys) {
  const v = process.env[k];
  if (!v) {
    missing++; console.log(`${red('MISSING')} ${k}`);
  } else {
    const masked = /PASSWORD|SECRET/i.test(k) ? v.replace(/./g,'*') : v;
    console.log(`${green('OK     ')} ${k} = ${masked}`);
  }
}
if (missing) {
  console.log(`\n${yellow('Some required variables are missing. Vendor signup will fail if vendor realm/client id absent.')}`);
}
console.log();