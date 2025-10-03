// Simple test script to check the Assets API route
async function testAssetsApi() {
  try {
    // Simulate a project ID (you would need to replace this with a real project ID)
    const projectId = 'test-project-id';
    
    console.log('Testing Assets API route for project:', projectId);
    
    // Make a request to the API route
    const response = await fetch(`http://localhost:3000/api/dashboard/${projectId}/assets`);
    
    console.log('Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Success! Received data:', JSON.stringify(data, null, 2));
    } else {
      const errorText = await response.text();
      console.log('Error response:', errorText);
    }
  } catch (error) {
    console.error('Test failed with error:', error);
  }
}

// Run the test
testAssetsApi();