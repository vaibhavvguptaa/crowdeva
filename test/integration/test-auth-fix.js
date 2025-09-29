// Simple test script to verify authentication flow fix
console.log('Testing authentication flow fix...');

// Check if we can access the auth API endpoints
fetch('/api/auth/location-aware', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'test@example.com',
    password: 'testpassword',
    authType: 'customers'
  })
})
.then(response => {
  console.log('Auth API response status:', response.status);
  return response.json();
})
.then(data => {
  console.log('Auth API response data:', data);
})
.catch(error => {
  console.error('Auth API error:', error);
});

// Check if we can access the set-session endpoint with absolute URL
const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
fetch(`${baseUrl}/api/auth/set-session`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    token: 'test-token',
    refreshToken: 'test-refresh-token',
    authType: 'customers'
  })
})
.then(response => {
  console.log('Set-session API response status:', response.status);
  return response.json();
})
.then(data => {
  console.log('Set-session API response data:', data);
})
.catch(error => {
  console.error('Set-session API error:', error);
});