import { describe, it, expect, vi, beforeEach } from 'vitest';

// Set env vars required by handler before import in each test
beforeEach(() => {
  process.env.NEXT_PUBLIC_KEYCLOAK_URL = 'http://localhost:8080';
  process.env.NEXT_PUBLIC_KEYCLOAK_REALM = 'Customer';
  process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID = 'customer-web';
  process.env.NEXT_PUBLIC_KEYCLOAK_DEV_REALM = 'developer';
  process.env.NEXT_PUBLIC_KEYCLOAK_DEV_CLIENT_ID = 'dev-web';
  process.env.NEXT_PUBLIC_KEYCLOAK_VENDOR_REALM = 'vendor';
  process.env.NEXT_PUBLIC_KEYCLOAK_VENDOR_CLIENT_ID = 'vendor-web';
  process.env.KEYCLOAK_ADMIN = 'admin';
  process.env.KEYCLOAK_ADMIN_PASSWORD = 'admin-password';
});

async function loadHandler() {
  const mod = await import('../src/app/api/auth/forgot-password/route');
  return mod.POST;
}

interface FakeRequestInit {
  email?: string;
  ip?: string;
  csrf?: boolean;
  type?: string; // auth user type
  bodyRaw?: any;
}

function buildRequest({ email = 'user@example.com', ip = '1.2.3.4', csrf = true, type = 'customers', bodyRaw }: FakeRequestInit = {}): any {
  const url = `http://localhost/api/auth/forgot-password?type=${type}`;
  const token = 'test_csrf_token_abc123';
  const headers = new Headers({ 'Content-Type': 'application/json', 'x-forwarded-for': ip });
  if (csrf) headers.set('X-CSRF-Token', token);
  const body = bodyRaw !== undefined ? bodyRaw : { email };
  return {
    url,
    headers,
    cookies: {
      get: (name: string) => (csrf && name === 'csrf-token' ? { value: token } : undefined)
    },
    nextUrl: new URL(url),
    json: async () => body,
  } as any;
}

function mockFetchSequence(responses: Array<{ ok: boolean; status?: number; json?: any; text?: string }>) {
  const seq = [...responses];
  (global as any).fetch = vi.fn().mockImplementation(async () => {
    const next = seq.shift() || { ok: true, status: 200, json: {} };
    return {
      ok: next.ok,
      status: next.status ?? (next.ok ? 200 : 500),
      json: async () => next.json ?? {},
      text: async () => next.text ?? JSON.stringify(next.json ?? {}),
    } as Response;
  });
}

describe('forgot-password route', () => {
  it('returns generic success and triggers execute-actions-email when user found', async () => {
    const POST = await loadHandler();
    mockFetchSequence([
      { ok: true, json: { access_token: 'admintok' } }, // admin token
      { ok: true, json: [{ id: 'user-123' }] }, // user search
      { ok: true, json: {} }, // execute actions email
    ]);

    const req = buildRequest();
    const res: any = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.message).toMatch(/If an account exists/);
    const calls = (fetch as any).mock.calls;
    expect(calls.length).toBe(3);
    const executeCall = calls[2];
    expect(executeCall[0]).toContain('/execute-actions-email');
    expect(executeCall[0]).toContain('lifespan=1800');
    expect(executeCall[1].method).toBe('PUT');
  });

  it('still returns generic success if admin token retrieval fails', async () => {
    const POST = await loadHandler();
    mockFetchSequence([
      { ok: false, status: 400, json: { error: 'invalid_grant' } },
    ]);
    const req = buildRequest({ ip: '2.2.2.2' });
    const res: any = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect((fetch as any).mock.calls.length).toBe(1);
  });

  it('rejects missing CSRF token', async () => {
    const POST = await loadHandler();
    const req = buildRequest({ csrf: false, ip: '3.3.3.3' });
    const res: any = await POST(req);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toMatch(/CSRF/);
  });

  it('returns 400 for invalid email format', async () => {
    const POST = await loadHandler();
    const req = buildRequest({ bodyRaw: { email: 'not-an-email' }, ip: '4.4.4.4' });
    const res: any = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid request');
  });

  it('enforces rate limiting after 5 attempts (6th returns 429)', async () => {
    const POST = await loadHandler();
    mockFetchSequence(Array.from({ length: 30 }, (_, i) => ({ ok: true, json: i % 3 === 0 ? { access_token: 'admintok' } : (i % 3 === 1 ? [{ id: 'user-abc' }] : {}) })));
    const ip = '9.9.9.9';
    for (let i = 0; i < 5; i++) {
      const res: any = await POST(buildRequest({ ip }));
      expect(res.status).toBe(200);
    }
    const limited: any = await POST(buildRequest({ ip }));
    expect(limited.status).toBe(429);
    const body = await limited.json();
    expect(body.error).toMatch(/Too many attempts/);
  });
});
