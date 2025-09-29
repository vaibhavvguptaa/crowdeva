// Test script for frontend authentication flow
async function testFrontendFlow() {
    try {
        console.log('Testing frontend authentication flow...');
        
        // Step 1: Get CSRF token
        const csrfResponse = await fetch('http://localhost:3000/api/auth/csrf-token');
        const { csrfToken } = await csrfResponse.json();
        console.log('CSRF Token obtained');
        
        // Step 2: Test location-aware authentication
        const locationResponse = await fetch('http://localhost:3000/api/auth/location-aware', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: 'test@example.com',
                password: 'testpassword',
                authType: 'customers'
            })
        });
        
        console.log('Location-aware auth response status:', locationResponse.status);
        
        if (locationResponse.ok) {
            const data = await locationResponse.json();
            console.log('Authentication successful');
            console.log('User info:', data.data?.user);
        } else {
            const error = await locationResponse.json();
            console.log('Authentication failed:', error);
        }
        
        // Step 3: Test protected route access
        console.log('\nTesting access to protected route...');
        const protectedResponse = await fetch('http://localhost:3000/projects');
        
        console.log('Protected route response status:', protectedResponse.status);
        
        if (protectedResponse.ok) {
            console.log('Access to protected route successful');
        } else {
            console.log('Access to protected route failed');
        }
        
    } catch (error) {
        console.error('Test failed:', error);
    }
}

testFrontendFlow();