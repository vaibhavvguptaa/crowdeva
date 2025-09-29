/**
 * Script to test the error analytics endpoint
 */
async function testErrorAnalytics() {
  try {
    console.log('Testing error analytics endpoint...');
    
    const testData = {
      errors: [
        {
          error: 'Test error for verification',
          type: 'unknown',
          component: 'test-script',
          userAgent: 'Node.js test script',
          timestamp: new Date().toISOString(),
          url: 'http://localhost:3000/test',
          additional: { test: true, environment: 'development' }
        }
      ]
    };

    const response = await fetch('http://localhost:3000/api/analytics/errors', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    console.log(`Response status: ${response.status}`);
    
    const result = await response.json();
    console.log('Response:', result);
    
    if (response.status === 200) {
      console.log('✅ Error analytics endpoint is working correctly!');
    } else {
      console.log('❌ Error analytics endpoint is not working properly');
    }
  } catch (error) {
    console.error('Error testing endpoint:', error);
  }
}

// Run the test
testErrorAnalytics();