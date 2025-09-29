import { NextRequest, NextResponse } from 'next/server';
import { projectService } from '@/services/projectService';

// GET /api/projects/test - Test endpoint to verify database connection
export async function GET(request: NextRequest) {
  try {
    // Try to fetch projects to test the database connection
    const projects = await projectService.getProjects();
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      projectCount: projects.length,
      projects: projects.slice(0, 3) // Return first 3 projects as sample
    });
  } catch (error) {
    console.error('Database test failed:', error);
    return NextResponse.json({
      success: false,
      message: 'Database connection failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}