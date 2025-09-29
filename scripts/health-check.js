#!/usr/bin/env node
/**
 * Simple health check script.
 * Usage: npm run health
 */

const targets = [
  { url: '/', name: 'root' },
  { url: '/health', name: 'health page', optional: true },
  { url: '/api/auth/csrf-token', name: 'csrf token' },
];

const base = process.env.HEALTH_BASE_URL || 'http://localhost:3000';
const timeoutMs = Number(process.env.HEALTH_TIMEOUT_MS || 15000);

async function check(target) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const url = base.replace(/\/$/, '') + target.url;
  const start = Date.now();
  try {
    const res = await fetch(url, { signal: controller.signal });
    const ms = Date.now() - start;
    clearTimeout(timer);
    if (!res.ok) {
      if (target.optional) {
        console.warn(`WARN ${target.name} ${url} -> ${res.status} in ${ms}ms`);
        return { warn: true };
      }
      throw new Error(`Status ${res.status}`);
    }
    console.log(`OK   ${target.name} ${url} -> ${res.status} in ${ms}ms`);
    return { ok: true };
  } catch (e) {
    clearTimeout(timer);
    if (target.optional) {
      console.warn(`WARN ${target.name} failed: ${e.message}`);
      return { warn: true };
    }
    console.error(`FAIL ${target.name} ${url}: ${e.message}`);
    return { fail: true };
  }
}

(async () => {
  const results = [];
  for (const t of targets) {
    // eslint-disable-next-line no-await-in-loop
    results.push(await check(t));
  }
  const failed = results.some(r => r.fail);
  if (failed) {
    console.error('Health check FAILED');
    process.exit(1);
  }
  console.log('Health check passed');
})();
