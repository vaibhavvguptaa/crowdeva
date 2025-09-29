// Performance test script to measure dashboard API response times
import fetch from 'node-fetch';

async function performanceTest() {
  const projectId = 'project-rlhf-001';
  const iterations = 5;
  
  console.log('Performance Testing Dashboard API Endpoints');
  console.log('==========================================\n');
  
  // Test workflow stats endpoint
  console.log('Testing Workflow Stats Endpoint:');
  let totalWorkflowTime = 0;
  
  for (let i = 0; i < iterations; i++) {
    const start = Date.now();
    try {
      const response = await fetch(`http://localhost:3000/api/dashboard/${projectId}/workflow-stats?timeframe=week`);
      await response.json();
      const end = Date.now();
      const duration = end - start;
      totalWorkflowTime += duration;
      console.log(`  Request ${i + 1}: ${duration}ms`);
    } catch (error) {
      console.log(`  Request ${i + 1}: Failed - ${error.message}`);
    }
  }
  
  const avgWorkflowTime = totalWorkflowTime / iterations;
  console.log(`  Average Response Time: ${avgWorkflowTime.toFixed(2)}ms\n`);
  
  // Test team endpoint
  console.log('Testing Team Endpoint:');
  let totalTeamTime = 0;
  
  for (let i = 0; i < iterations; i++) {
    const start = Date.now();
    try {
      const response = await fetch(`http://localhost:3000/api/dashboard/${projectId}/team`);
      await response.json();
      const end = Date.now();
      const duration = end - start;
      totalTeamTime += duration;
      console.log(`  Request ${i + 1}: ${duration}ms`);
    } catch (error) {
      console.log(`  Request ${i + 1}: Failed - ${error.message}`);
    }
  }
  
  const avgTeamTime = totalTeamTime / iterations;
  console.log(`  Average Response Time: ${avgTeamTime.toFixed(2)}ms\n`);
  
  // Test both endpoints together (simulating dashboard load)
  console.log('Testing Parallel Requests (Simulating Dashboard Load):');
  let totalParallelTime = 0;
  
  for (let i = 0; i < iterations; i++) {
    const start = Date.now();
    try {
      const [workflowRes, teamRes] = await Promise.all([
        fetch(`http://localhost:3000/api/dashboard/${projectId}/workflow-stats?timeframe=week`),
        fetch(`http://localhost:3000/api/dashboard/${projectId}/team`)
      ]);
      
      await Promise.all([
        workflowRes.json(),
        teamRes.json()
      ]);
      
      const end = Date.now();
      const duration = end - start;
      totalParallelTime += duration;
      console.log(`  Request ${i + 1}: ${duration}ms`);
    } catch (error) {
      console.log(`  Request ${i + 1}: Failed - ${error.message}`);
    }
  }
  
  const avgParallelTime = totalParallelTime / iterations;
  console.log(`  Average Response Time: ${avgParallelTime.toFixed(2)}ms\n`);
  
  // Test combined endpoint (new optimization)
  console.log('Testing Combined Endpoint (Optimization):');
  let totalCombinedTime = 0;
  
  for (let i = 0; i < iterations; i++) {
    const start = Date.now();
    try {
      const response = await fetch(`http://localhost:3000/api/dashboard/${projectId}/combined`);
      await response.json();
      const end = Date.now();
      const duration = end - start;
      totalCombinedTime += duration;
      console.log(`  Request ${i + 1}: ${duration}ms`);
    } catch (error) {
      console.log(`  Request ${i + 1}: Failed - ${error.message}`);
    }
  }
  
  const avgCombinedTime = totalCombinedTime / iterations;
  console.log(`  Average Response Time: ${avgCombinedTime.toFixed(2)}ms\n`);
  
  // Test with caching (simulate second load)
  console.log('Testing Cached Requests (Second Load):');
  let totalCachedTime = 0;
  
  for (let i = 0; i < iterations; i++) {
    const start = Date.now();
    try {
      // Make requests that should hit the cache
      const [workflowRes, teamRes] = await Promise.all([
        fetch(`http://localhost:3000/api/dashboard/${projectId}/workflow-stats?timeframe=week`),
        fetch(`http://localhost:3000/api/dashboard/${projectId}/team`)
      ]);
      
      await Promise.all([
        workflowRes.json(),
        teamRes.json()
      ]);
      
      const end = Date.now();
      const duration = end - start;
      totalCachedTime += duration;
      console.log(`  Request ${i + 1}: ${duration}ms`);
    } catch (error) {
      console.log(`  Request ${i + 1}: Failed - ${error.message}`);
    }
  }
  
  const avgCachedTime = totalCachedTime / iterations;
  console.log(`  Average Response Time: ${avgCachedTime.toFixed(2)}ms\n`);
  
  console.log('Summary:');
  console.log(`  Workflow Stats Endpoint: ${avgWorkflowTime.toFixed(2)}ms average`);
  console.log(`  Team Endpoint: ${avgTeamTime.toFixed(2)}ms average`);
  console.log(`  Parallel Requests: ${avgParallelTime.toFixed(2)}ms average`);
  console.log(`  Combined Endpoint: ${avgCombinedTime.toFixed(2)}ms average`);
  console.log(`  Cached Requests: ${avgCachedTime.toFixed(2)}ms average`);
  console.log(`  Total Dashboard Load Time (sequential): ${(avgWorkflowTime + avgTeamTime).toFixed(2)}ms`);
  console.log(`  Improvement with Combined Endpoint: ${((avgWorkflowTime + avgTeamTime - avgCombinedTime) / (avgWorkflowTime + avgTeamTime) * 100).toFixed(1)}%`);
  console.log(`  Improvement with Caching: ${((avgWorkflowTime + avgTeamTime - avgCachedTime) / (avgWorkflowTime + avgTeamTime) * 100).toFixed(1)}%`);
}

// Run the performance test
performanceTest().catch(console.error);