// Dashboard Performance Monitoring Script
import fetch from 'node-fetch';
import fs from 'fs';

async function monitorPerformance() {
  const projectId = 'project-rlhf-001';
  const iterations = 10;
  const results = [];
  
  console.log('Monitoring Dashboard Performance Over Time');
  console.log('========================================\n');
  
  for (let i = 0; i < iterations; i++) {
    const timestamp = new Date().toISOString();
    
    try {
      // Test combined endpoint performance
      const start = Date.now();
      const response = await fetch(`http://localhost:3000/api/dashboard/${projectId}/combined`);
      const data = await response.json();
      const end = Date.now();
      const duration = end - start;
      
      results.push({
        timestamp,
        duration,
        status: response.status,
        dataSize: JSON.stringify(data).length
      });
      
      console.log(`Test ${i + 1}: ${duration}ms (Status: ${response.status})`);
    } catch (error) {
      results.push({
        timestamp,
        duration: null,
        status: 'ERROR',
        error: error.message
      });
      
      console.log(`Test ${i + 1}: FAILED - ${error.message}`);
    }
    
    // Wait 1 second between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Calculate statistics
  const validResults = results.filter(r => r.duration !== null);
  if (validResults.length > 0) {
    const durations = validResults.map(r => r.duration);
    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    const minDuration = Math.min(...durations);
    const maxDuration = Math.max(...durations);
    
    console.log('\nPerformance Summary:');
    console.log(`  Average Response Time: ${avgDuration.toFixed(2)}ms`);
    console.log(`  Fastest Response: ${minDuration}ms`);
    console.log(`  Slowest Response: ${maxDuration}ms`);
    console.log(`  Success Rate: ${(validResults.length / iterations * 100).toFixed(1)}%`);
    
    // Save results to file
    const report = {
      timestamp: new Date().toISOString(),
      testRuns: iterations,
      results,
      summary: {
        averageResponseTime: avgDuration,
        fastestResponse: minDuration,
        slowestResponse: maxDuration,
        successRate: validResults.length / iterations
      }
    };
    
    fs.writeFileSync(
      `dashboard-performance-report-${Date.now()}.json`,
      JSON.stringify(report, null, 2)
    );
    
    console.log('\nDetailed results saved to performance report file.');
  }
}

// Run the monitoring script
monitorPerformance().catch(console.error);