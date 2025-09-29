// Test script to verify location-aware authentication flow
import fetch from 'node-fetch';
import { CookieJar } from 'tough-cookie';
import fetchCookie from 'fetch-cookie';

async function testLocationAuth() {
  try {
    console.log('Testing location-aware authentication flow...');
    
    // Create a cookie jar to store cookies
    const cookieJar = new CookieJar();
    const fetchWithCookies = fetchCookie(fetch, cookieJar);
    
    // Test data
    const testData = {
      email: 'test@example.com',
      password: 'TestPassword123!',
      authType: 'customers'
    };
    
    // Make request to location-aware authentication endpoint
    console.log('Making authentication request...');
    const authResponse = await fetchWithCookies('http://localhost:3000/api/auth/location-aware', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(testData)
    });
    
    console.log('Authentication response status:', authResponse.status);
    
    if (authResponse.ok) {
      const data = await authResponse.json();
      console.log('Authentication successful:', data);
    } else {
      const error = await authResponse.json();
      console.log('Authentication failed:', error);
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testLocationAuth();