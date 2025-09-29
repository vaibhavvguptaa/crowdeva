import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getKeycloakConfig } from '@/lib/config';
import { rateLimitMiddleware, getRateLimitInfo } from '@/lib/rateLimit';
import { CSRFProtection } from '@/lib/csrf';
import { AuthUserType } from '@/types/auth';

// Basic schema for incoming payload
const bodySchema = z.object({
	email: z.string().min(1, 'Email is required').email('Invalid email'),
});

// Helper function to create CORS headers
function getCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || 'http://localhost:3000',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-CSRF-Token',
    'Access-Control-Allow-Credentials': 'true',
  };
}

export async function OPTIONS() {
  const headers = getCorsHeaders();
  return new NextResponse(null, {
    status: 200,
    headers: headers,
  });
}

export async function POST(request: NextRequest) {
	// CSRF validation (enabled for consistency with other state-changing auth endpoints)
	if (!CSRFProtection.validateToken(request)) {
		const response = NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });
    const corsHeaders = getCorsHeaders();
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    return response;
	}

	// Apply shared rate limiting (prevents abuse of reset endpoint)
	const rateLimited = await rateLimitMiddleware(request);
	if (rateLimited) {
    const corsHeaders = getCorsHeaders();
    Object.entries(corsHeaders).forEach(([key, value]) => {
      rateLimited.headers.set(key, value);
    });
		return rateLimited; // already includes status 429 + headers
	}

	try {
		const url = new URL(request.url);
		const typeParam = (url.searchParams.get('type') as AuthUserType) || 'customers';
		const role: AuthUserType = ['customers', 'developers', 'vendors'].includes(typeParam) ? typeParam : 'customers';
		const { realm, url: keycloakUrl, clientId } = getKeycloakConfig(role) as any;
		if (!realm || !keycloakUrl || !clientId) {
      const response = NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
      const corsHeaders = getCorsHeaders();
      Object.entries(corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      return response;
		}

		const json = await request.json().catch(() => ({}));
		const parsed = bodySchema.safeParse(json);
		if (!parsed.success) {
      const response = NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 });
      const corsHeaders = getCorsHeaders();
      Object.entries(corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      return response;
		}
		const { email } = parsed.data;

		// We must NOT reveal whether user exists. We'll attempt to look up user via admin API;
		const adminToken = await getAdminToken();
		if (adminToken) {
			try {
				// 1. Search user by email (exact match) in target realm
				const searchUrl = `${keycloakUrl}/admin/realms/${realm}/users?email=${encodeURIComponent(email)}&exact=true`;
				const searchResp = await fetch(searchUrl, { headers: { Authorization: `Bearer ${adminToken}` }, cache: 'no-store' });
				if (searchResp.ok) {
					const users = await searchResp.json();
					if (Array.isArray(users) && users.length > 0) {
						const userId = users[0].id;
						if (userId) {
							// 2. Trigger execute actions email for UPDATE_PASSWORD (Keycloak will send email if SMTP configured)
							const actionUrl = `${keycloakUrl}/admin/realms/${realm}/users/${userId}/execute-actions-email`;
							const actionResp = await fetch(actionUrl + '?lifespan=1800&redirectUri=' + encodeURIComponent(`${keycloakUrl}/realms/${realm}/account/#/`), {
								method: 'PUT',
								headers: {
									Authorization: `Bearer ${adminToken}`,
									'Content-Type': 'application/json'
								},
								body: JSON.stringify(['UPDATE_PASSWORD'])
							});
							if (!actionResp.ok) {
								// Log but do not disclose
								console.warn('Failed to trigger reset email', actionResp.status, await actionResp.text());
							}
						}
					}
				} else {
					console.warn('User search failed', searchResp.status, await searchResp.text());
				}
			} catch (innerErr) {
				console.warn('Forgot password internal action error (suppressed):', innerErr);
			}
		} else {
			console.warn('No admin token available to process forgot-password');
		}

		const forwarded = request.headers.get('x-forwarded-for');
		const realIP = request.headers.get('x-real-ip');
		const clientIP = forwarded?.split(',')[0].trim() || realIP || 'unknown';
		const rateMeta = getRateLimitInfo(clientIP, request.nextUrl.pathname);

		const response = NextResponse.json({
			success: true,
			message: 'If an account exists for this email, password reset instructions were sent.',
			realm,
			role,
		});
		response.headers.set('X-RateLimit-Limit', rateMeta.limit.toString());
		response.headers.set('X-RateLimit-Remaining', rateMeta.remaining.toString());
		response.headers.set('X-RateLimit-Reset', rateMeta.reset.toString());
    
    // Add CORS headers
    const corsHeaders = getCorsHeaders();
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
		return response;
	} catch (e) {
		console.error('Forgot password error:', e);
    const response = NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    const corsHeaders = getCorsHeaders();
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    return response;
	}
}

async function getAdminToken(): Promise<string | null> {
  try {
    console.log('Getting admin token with credentials:');
    console.log('Keycloak URL:', process.env.NEXT_PUBLIC_KEYCLOAK_URL);
    console.log('Admin Username:', process.env.KEYCLOAK_ADMIN);
    console.log('Admin Password:', process.env.KEYCLOAK_ADMIN_PASSWORD ? '***' : 'NOT SET');
    
    const keycloakUrl = process.env.NEXT_PUBLIC_KEYCLOAK_URL;
    const adminUsername = process.env.KEYCLOAK_ADMIN || 'admin';
    const adminPassword = process.env.KEYCLOAK_ADMIN_PASSWORD;
    
    if (!keycloakUrl || !adminPassword) {
      console.log('Missing keycloak URL or admin password');
      return null;
    }
    
    const tokenEndpoint = `${keycloakUrl}/realms/master/protocol/openid-connect/token`;
    console.log('Token endpoint:', tokenEndpoint);
    
    const formData = new URLSearchParams();
    formData.append('grant_type', 'password');
    formData.append('client_id', 'admin-cli');
    formData.append('username', adminUsername);
    formData.append('password', adminPassword);
    
    console.log('Making request to token endpoint');
    const resp = await fetch(tokenEndpoint, { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, 
      body: formData 
    });
    
    console.log('Token endpoint response status:', resp.status);
    
    if (!resp.ok) {
      const errorText = await resp.text();
      console.log('Token endpoint error response:', errorText);
      return null;
    }
    
    const json = await resp.json();
    console.log('Token endpoint success response:', json);
    return json.access_token as string;
  } catch (e) {
    console.warn('Failed to get admin token for forgot-password', e);
    return null;
  }
}
