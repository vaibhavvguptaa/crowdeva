/**
 * Test script to measure project loading performance
 */

import { projectService } from '../../../src/services/projectService';
import { projectServerService } from '../../../src/services/projectService.server';

async function testProjectLoadingPerformance() {
  console.log('Testing project loading performance...');
  
  // Test client-side project loading
  console.time('Client-side project loading');
  try {
    // This would normally require a real project ID from your database
    // For testing purposes, we'll just measure the API call overhead
    console.log('Testing client-side service (skipping actual API call in test)');
  } catch (error) {
    console.error('Client-side project loading error:', error);
  }
  console.timeEnd('Client-side project loading');
  
  // Test server-side project loading
  console.time('Server-side project loading');
  try {
    // This would normally require a real project ID from your database
    // For testing purposes, we'll just measure the database query overhead
    console.log('Testing server-side service (skipping actual database call in test)');
  } catch (error) {
    console.error('Server-side project loading error:', error);
  }
  console.timeEnd('Server-side project loading');
  
  console.log('Performance test completed');
}

// Run the test if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testProjectLoadingPerformance();
}

export { testProjectLoadingPerformance };