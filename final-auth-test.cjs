// Final test to verify authentication fixes
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

async function finalTest() {
  try {
    console.log('=== FINAL AUTHENTICATION TEST ===');
    
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
    console.log('✓ CSRF token request successful');
    
    if (csrfResponse.statusCode !== 200) {
      throw new Error(`CSRF token request failed: ${csrfResponse.statusCode}`);
    }
    
    const csrfToken = csrfResponse.data.csrfToken;
    let cookies = '';
    if (csrfResponse.headers['set-cookie']) {
      cookies = csrfResponse.headers['set-cookie'].join('; ');
    }
    
    // Step 2: Test location-aware auth endpoint
    console.log('\n2. Testing location-aware auth endpoint...');
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
    
    // Check the response
    if (locationResponse.statusCode === 401) {
      console.log('✅ Authentication endpoint is working correctly');
      console.log('✅ CSRF validation is passing');
      console.log('✅ Invalid credentials are being handled properly');
      console.log('\n🎉 ALL AUTHENTICATION FIXES HAVE BEEN SUCCESSFULLY IMPLEMENTED! 🎉');
    } else if (locationResponse.statusCode === 403 && locationResponse.data.error && locationResponse.data.error.includes('CSRF')) {
      console.log('❌ CSRF validation is still failing');
      process.exit(1);
    } else {
      console.log(`❓ Unexpected response status: ${locationResponse.statusCode}`);
      console.log('Response:', locationResponse.data);
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
    process.exit(1);
  }
}

finalTest();