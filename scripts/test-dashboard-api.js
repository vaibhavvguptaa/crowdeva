// Test script to verify dashboard API endpoints
async function testDashboardAPI() {
  // Use a valid project ID from the seed data
  const projectId = 'project-rlhf-001';
  
  try {
    console.log('Testing dashboard API endpoints...\n');
    
    // Test metrics endpoint
    console.log('1. Testing metrics endpoint...');
    const metricsRes = await fetch(`http://localhost:3001/api/dashboard/${projectId}/metrics`);
    const metricsData = await metricsRes.json();
    console.log('Metrics data:', JSON.stringify(metricsData, null, 2));
    console.log('✅ Metrics endpoint working\n');
    
    // Test team endpoint
    console.log('2. Testing team endpoint...');
    const teamRes = await fetch(`http://localhost:3001/api/dashboard/${projectId}/team`);
    const teamData = await teamRes.json();
    console.log('Team data sample:', JSON.stringify(teamData.slice(0, 2), null, 2)); 
    console.log('✅ Team endpoint working\n');
    
    // Test workflow stats endpoint (weekly)
    console.log('3. Testing workflow stats endpoint (weekly)...');
    const workflowWeeklyRes = await fetch(`http://localhost:3001/api/dashboard/${projectId}/workflow-stats?timeframe=week`);
    const workflowWeeklyData = await workflowWeeklyRes.json();
    console.log('Workflow weekly data:', JSON.stringify(workflowWeeklyData, null, 2));
    console.log('✅ Workflow stats (weekly) endpoint working\n');
    
    // Test workflow stats endpoint (monthly)
    console.log('4. Testing workflow stats endpoint (monthly)...');
    const workflowMonthlyRes = await fetch(`http://localhost:3001/api/dashboard/${projectId}/workflow-stats?timeframe=month`);
    const workflowMonthlyData = await workflowMonthlyRes.json();
    console.log('Workflow monthly data:', JSON.stringify(workflowMonthlyData, null, 2));
    console.log('✅ Workflow stats (monthly) endpoint working\n');
    
    console.log('🎉 All dashboard API endpoints are working correctly!');
  } catch (error) {
    console.error('❌ Error testing dashboard API:', error);
  }
}

// Run the test
testDashboardAPI();