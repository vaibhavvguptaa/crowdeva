import fetch from 'node-fetch';
import { CookieJar } from 'tough-cookie';
import { wrapper } from 'axios-cookiejar-support';
import axios from 'axios';

async function completeAuthTest() {
  console.log('Testing complete authentication flow with proper cookie handling...');
  
  // Create a cookie jar to maintain cookies between requests
  const cookieJar = new CookieJar();
  const client = wrapper(axios.create({ 
    jar: cookieJar, 
    withCredentials: true,
    baseURL: 'http://localhost:3000'
  }));
  
  try {
    // 1. Get CSRF token
    console.log('\n1. Getting CSRF token...');
    const csrfResponse = await client.get('/api/auth/csrf-token');
    console.log('CSRF response status:', csrfResponse.status);
    console.log('CSRF token:', csrfResponse.data.csrfToken);
    
    // Get cookies from jar for debugging
    const cookies = await cookieJar.getCookies('http://localhost:3000');
    console.log('Cookies in jar:', cookies.map(c => `${c.key}=${c.value}`).join(', '));
    
    // 2. Attempt authentication
    console.log('\n2. Attempting authentication...');
    const authResponse = await client.post('/api/auth/location-aware', {
      username: 'customer@example.com',
      password: 'password123',
      authType: 'customers'
    }, {
      headers: {
        'X-CSRF-Token': csrfResponse.data.csrfToken
      }
    });
    
    console.log('Authentication response status:', authResponse.status);
    console.log('Authentication response data:', JSON.stringify(authResponse.data, null, 2));
    
    // Get updated cookies
    const updatedCookies = await cookieJar.getCookies('http://localhost:3000');
    console.log('Updated cookies in jar:', updatedCookies.map(c => `${c.key}=${c.value}`).join(', '));
    
    // 3. Test accessing a protected endpoint
    if (authResponse.status === 200) {
      console.log('\n3. Testing access to protected endpoint...');
      try {
        const protectedResponse = await client.get('/api/projects', {
          headers: {
            'Authorization': `Bearer ${authResponse.data.access_token}`
          }
        });
        console.log('Protected endpoint response status:', protectedResponse.status);
      } catch (error) {
        console.log('Protected endpoint error:', error.response?.status, error.response?.data);
      }
    }
    
  } catch (error) {
    console.error('Error in complete auth test:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

completeAuthTest();