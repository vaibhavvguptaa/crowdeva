// Simple script to verify project database functionality
// This script should be run with ts-node or compiled first

async function verifyProjectDB() {
  try {
    console.log('Testing project database functionality...');
    
    // Dynamically import the project service
    const { projectServerService } = await import('../src/services/projectService.server.ts');
    
    // Create a test project
    const testProjectData = {
      name: 'DB Verification Test Project',
      description: 'Test project to verify database functionality',
      status: 'active',
      type: 'General'
    };
    
    console.log('Creating test project...');
    const createdProject = await projectServerService.createProject(testProjectData);
    console.log('✓ Project created successfully with ID:', createdProject.id);
    
    // Fetch the project back
    console.log('Fetching project back...');
    const fetchedProject = await projectServerService.getProject(createdProject.id);
    if (fetchedProject) {
      console.log('✓ Project fetched successfully');
      console.log('Project name:', fetchedProject.name);
    } else {
      console.log('✗ Failed to fetch project');
    }
    
    // Fetch all projects
    console.log('Fetching all projects...');
    const allProjects = await projectServerService.getProjects();
    console.log(`✓ Found ${allProjects.length} projects in total`);
    
    console.log('Database verification completed successfully!');
  } catch (error) {
    console.error('Database verification failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the verification
verifyProjectDB().catch(console.error);