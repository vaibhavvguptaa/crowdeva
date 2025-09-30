// Test script that properly handles cookies like a browser would
const http = require('http');

// Function to make HTTP requests with cookie handling
function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: JSON.parse(data)
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: data
          });
        }
      });
    });
    
    req.on('error', (e) => {
      reject(e);
    });
    
    if (postData) {
      req.write(postData);
    }
    
    req.end();
  });
}

async function testCSRF() {
  try {
    console.log('Testing CSRF flow with proper cookie handling...');
    
    // Step 1: Get CSRF token
    console.log('\n1. Getting CSRF token...');
    const csrfOptions = {
      hostname: 'localhost',
      port: 3002,
      path: '/api/auth/csrf-token',
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    };
    
    const csrfResponse = await makeRequest(csrfOptions);
    console.log('CSRF response status:', csrfResponse.statusCode);
    
    if (csrfResponse.statusCode !== 200) {
      throw new Error(`CSRF token request failed: ${csrfResponse.statusCode}`);
    }
    
    const csrfToken = csrfResponse.data.csrfToken;
    console.log('CSRF token:', csrfToken);
    
    // Extract cookies from response
    let cookies = '';
    if (csrfResponse.headers['set-cookie']) {
      cookies = csrfResponse.headers['set-cookie'].join('; ');
      console.log('Cookies:', cookies);
    }
    
    // Step 2: Use CSRF token with cookies
    console.log('\n2. Using CSRF token with cookies...');
    const locationOptions = {
      hostname: 'localhost',
      port: 3002,
      path: '/api/auth/location-aware',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
        'Cookie': cookies
      }
    };
    
    const postData = JSON.stringify({
      username: 'test@example.com',
      password: 'password123',
      authType: 'customers'
    });
    
    locationOptions.headers['Content-Length'] = Buffer.byteLength(postData);
    
    const locationResponse = await makeRequest(locationOptions, postData);
    console.log('Location response status:', locationResponse.statusCode);
    
    if (locationResponse.statusCode === 403 && locationResponse.data.error && locationResponse.data.error.includes('CSRF')) {
      console.log('❌ CSRF validation is failing');
    } else if (locationResponse.statusCode === 401) {
      console.log('✅ CSRF validation passed (got expected 401 for invalid credentials)');
    } else {
      console.log('Response:', locationResponse.data);
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
    process.exit(1);
  }
}

testCSRF();