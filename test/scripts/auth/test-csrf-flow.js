// Test script to verify CSRF token flow
import fetch from 'node-fetch';
import { CookieJar } from 'tough-cookie';
import fetchCookie from 'fetch-cookie';

async function testCsrfFlow() {
  try {
    console.log('Testing CSRF token flow...');
    
    // Create a cookie jar to store cookies
    const cookieJar = new CookieJar();
    const fetchWithCookies = fetchCookie(fetch, cookieJar);
    
    // Step 1: Get CSRF token
    console.log('Getting CSRF token...');
    const csrfResponse = await fetchWithCookies('http://localhost:3001/api/auth/csrf-token', {
      method: 'GET',
      credentials: 'include'
    });
    
    if (!csrfResponse.ok) {
      throw new Error(`Failed to get CSRF token: ${csrfResponse.status}`);
    }
    
    const { csrfToken } = await csrfResponse.json();
    console.log('CSRF token obtained:', csrfToken);
    
    // Step 2: Test set-session endpoint
    console.log('Testing set-session endpoint...');
    
    // Create a valid JWT token structure (header.payload.signature)
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
    const payload = Buffer.from(JSON.stringify({ 
      sub: 'test-user',
      exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
    })).toString('base64');
    const signature = 'test-signature';
    const validToken = `${header}.${payload}.${signature}`;
    
    const sessionResponse = await fetchWithCookies('http://localhost:3001/api/auth/set-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken
      },
      credentials: 'include',
      body: JSON.stringify({
        token: validToken,
        refreshToken: 'test-refresh-token',
        authType: 'customers'
      })
    });
    
    console.log('Set-session response status:', sessionResponse.status);
    
    if (sessionResponse.ok) {
      const data = await sessionResponse.json();
      console.log('Set-session successful:', data);
    } else {
      const error = await sessionResponse.json();
      console.log('Set-session failed:', error);
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testCsrfFlow();