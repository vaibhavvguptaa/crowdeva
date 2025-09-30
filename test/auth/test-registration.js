import fetch from 'node-fetch';
import { CookieJar } from 'tough-cookie';
import fetchCookie from 'fetch-cookie';

// Create a cookie jar to store cookies
const cookieJar = new CookieJar();
const fetchWithCookies = fetchCookie(fetch, cookieJar);

async function testRegistration() {
  try {
    // Get CSRF token (this will also set the csrf-token cookie)
    const csrfResponse = await fetchWithCookies('http://localhost:3001/api/auth/csrf-token', {
      method: 'GET',
      credentials: 'include'
    });
    
    const { csrfToken } = await csrfResponse.json();
    console.log('CSRF Token:', csrfToken);
    
    // Get the cookies that were set
    const cookies = cookieJar.getCookiesSync('http://localhost:3001');
    console.log('Cookies:', cookies.map(c => `${c.key}=${c.value}`));

    // Test registration with cookies
    const registrationResponse = await fetchWithCookies('http://localhost:3001/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        companyName: 'Test Company',
        group: 'customers'
      }),
      credentials: 'include'
    });

    console.log('Registration response status:', registrationResponse.status);
    const responseData = await registrationResponse.json();
    console.log('Registration response data:', responseData);
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testRegistration();