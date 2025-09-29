import { NextRequest, NextResponse } from 'next/server';
import { CSRFProtection } from '@/lib/csrf';

/**
 * DEPRECATED: This endpoint is deprecated in favor of /api/auth/set-session
 * It remains for backward compatibility but should not be used in new code.
 */
export async function POST(request: NextRequest) {
  try {
    if (!CSRFProtection.validateToken(request)) {
      return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });
    }
    
    const { token, refreshToken } = await request.json() as { token?: string; refreshToken?: string };
    
    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }
    
    if (!token.match(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/)) {
      return NextResponse.json({ error: 'Invalid token format' }, { status: 400 });
    }
    
    let payload: any; let exp: number;
    try {
      payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      exp = payload.exp; // seconds
    } catch (e) {
      return NextResponse.json({ error: 'Invalid token payload' }, { status: 400 });
    }
    
    const expiresAtMs = exp * 1000;
    const maxAge = Math.floor((expiresAtMs - Date.now()) / 1000);
    
    if (maxAge <= 60) {
      return NextResponse.json({ error: 'Token is expired or expires too soon' }, { status: 400 });
    }
    
    const isProd = process.env.NODE_ENV === 'production';
    const cookies: string[] = [];
    
    cookies.push([
      `kc-token=${token}`,
      'HttpOnly','Path=/',`Max-Age=${maxAge}`,'SameSite=Strict',
      ...(isProd ? ['Secure'] : [])
    ].join('; '));
    
    // Note: This approach is deprecated. Refresh tokens should be stored server-side.
    if (refreshToken) {
      console.warn('DEPRECATED: Storing refresh token in client-side cookie. Use /api/auth/set-session instead.');
      cookies.push([
        `kc-refresh-token=${refreshToken}`,
        'HttpOnly','Path=/',`Max-Age=${maxAge + 3600}`,'SameSite=Strict',
        ...(isProd ? ['Secure'] : [])
      ].join('; '));
    }
    
    const response = NextResponse.json({ 
      success: true, 
      expiresAt: new Date(expiresAtMs).toISOString(),
      warning: 'DEPRECATED: Use /api/auth/set-session instead'
    });
    
    response.headers.set('Set-Cookie', cookies.join(', '));
    return response;
  } catch (error) {
    console.error('Set token error:', error);
    return NextResponse.json({ error: 'Failed to set token' }, { status: 500 });
  }
}