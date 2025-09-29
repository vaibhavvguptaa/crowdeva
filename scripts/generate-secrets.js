#!/usr/bin/env node

/**
 * Script to generate secure secrets for CSRF and session tokens
 * Run this script to generate secure random strings for your production environment
 */

const crypto = require('crypto');

function generateSecret(length = 64) {
  return crypto.randomBytes(length).toString('hex');
}

function main() {
  console.log('Generated secrets for production environment:');
  console.log('');
  console.log('CSRF_SECRET=' + generateSecret());
  console.log('SESSION_SECRET=' + generateSecret());
  console.log('');
  console.log('Add these to your .env file, replacing the placeholder values.');
}

if (require.main === module) {
  main();
}