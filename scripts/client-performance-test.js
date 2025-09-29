// Client-side performance test for dashboard components
import fetch from 'node-fetch';

async function clientPerformanceTest() {
  const projectId = 'project-rlhf-001';
  const iterations = 5;
  
  console.log('Client-Side Performance Testing Dashboard Components');
  console.log('==================================================\n');
  
  // Test the test dashboard page load time
  console.log('Testing Test Dashboard Page Load Time:');
  let totalPageLoadTime = 0;
  
  for (let i = 0; i < iterations; i++) {
    const start = Date.now();
    try {
      const response = await fetch(`http://localhost:3000/test-dashboard-charts`);
      await response.text();
      const end = Date.now();
      const duration = end - start;
      totalPageLoadTime += duration;
      console.log(`  Request ${i + 1}: ${duration}ms`);
    } catch (error) {
      console.log(`  Request ${i + 1}: Failed - ${error.message}`);
    }
  }
  
  const avgPageLoadTime = totalPageLoadTime / iterations;
  console.log(`  Average Page Load Time: ${avgPageLoadTime.toFixed(2)}ms\n`);
  
  // Test individual component load times (simulate what happens in browser)
  console.log('Testing Individual Component Data Fetch Times:');
  
  // Test Issue Tracker Chart data fetch
  console.log('  Issue Tracker Chart:');
  let totalIssueTrackerTime = 0;
  
  for (let i = 0; i < iterations; i++) {
    const start = Date.now();
    try {
      const response = await fetch(`http://localhost:3000/api/dashboard/${projectId}/team`);
      await response.json();
      const end = Date.now();
      const duration = end - start;
      totalIssueTrackerTime += duration;
      console.log(`    Request ${i + 1}: ${duration}ms`);
    } catch (error) {
      console.log(`    Request ${i + 1}: Failed - ${error.message}`);
    }
  }
  
  const avgIssueTrackerTime = totalIssueTrackerTime / iterations;
  console.log(`    Average Fetch Time: ${avgIssueTrackerTime.toFixed(2)}ms\n`);
  
  // Test Workflow Activity Chart data fetch (weekly)
  console.log('  Workflow Activity Chart (Weekly):');
  let totalWorkflowWeeklyTime = 0;
  
  for (let i = 0; i < iterations; i++) {
    const start = Date.now();
    try {
      const response = await fetch(`http://localhost:3000/api/dashboard/${projectId}/workflow-stats?timeframe=week`);
      await response.json();
      const end = Date.now();
      const duration = end - start;
      totalWorkflowWeeklyTime += duration;
      console.log(`    Request ${i + 1}: ${duration}ms`);
    } catch (error) {
      console.log(`    Request ${i + 1}: Failed - ${error.message}`);
    }
  }
  
  const avgWorkflowWeeklyTime = totalWorkflowWeeklyTime / iterations;
  console.log(`    Average Fetch Time: ${avgWorkflowWeeklyTime.toFixed(2)}ms\n`);
  
  // Test Workflow Activity Chart data fetch (monthly)
  console.log('  Workflow Activity Chart (Monthly):');
  let totalWorkflowMonthlyTime = 0;
  
  for (let i = 0; i < iterations; i++) {
    const start = Date.now();
    try {
      const response = await fetch(`http://localhost:3000/api/dashboard/${projectId}/workflow-stats?timeframe=month`);
      await response.json();
      const end = Date.now();
      const duration = end - start;
      totalWorkflowMonthlyTime += duration;
      console.log(`    Request ${i + 1}: ${duration}ms`);
    } catch (error) {
      console.log(`    Request ${i + 1}: Failed - ${error.message}`);
    }
  }
  
  const avgWorkflowMonthlyTime = totalWorkflowMonthlyTime / iterations;
  console.log(`    Average Fetch Time: ${avgWorkflowMonthlyTime.toFixed(2)}ms\n`);
  
  // Test combined endpoint
  console.log('  Combined Endpoint (Optimization):');
  let totalCombinedTime = 0;
  
  for (let i = 0; i < iterations; i++) {
    const start = Date.now();
    try {
      const response = await fetch(`http://localhost:3000/api/dashboard/${projectId}/combined`);
      await response.json();
      const end = Date.now();
      const duration = end - start;
      totalCombinedTime += duration;
      console.log(`    Request ${i + 1}: ${duration}ms`);
    } catch (error) {
      console.log(`    Request ${i + 1}: Failed - ${error.message}`);
    }
  }
  
  const avgCombinedTime = totalCombinedTime / iterations;
  console.log(`    Average Fetch Time: ${avgCombinedTime.toFixed(2)}ms\n`);
  
  console.log('Client-Side Performance Summary:');
  console.log(`  Test Dashboard Page Load: ${avgPageLoadTime.toFixed(2)}ms average`);
  console.log(`  Issue Tracker Chart Data Fetch: ${avgIssueTrackerTime.toFixed(2)}ms average`);
  console.log(`  Workflow Chart (Weekly) Data Fetch: ${avgWorkflowWeeklyTime.toFixed(2)}ms average`);
  console.log(`  Workflow Chart (Monthly) Data Fetch: ${avgWorkflowMonthlyTime.toFixed(2)}ms average`);
  console.log(`  Combined Endpoint Data Fetch: ${avgCombinedTime.toFixed(2)}ms average`);
  console.log(`  Total Component Data Fetch Time (sequential): ${(avgIssueTrackerTime + avgWorkflowWeeklyTime + avgWorkflowMonthlyTime).toFixed(2)}ms`);
  console.log(`  Improvement with Combined Endpoint: ${((avgIssueTrackerTime + avgWorkflowWeeklyTime + avgWorkflowMonthlyTime - avgCombinedTime) / (avgIssueTrackerTime + avgWorkflowWeeklyTime + avgWorkflowMonthlyTime) * 100).toFixed(1)}%`);
}

// Run the client performance test
clientPerformanceTest().catch(console.error);