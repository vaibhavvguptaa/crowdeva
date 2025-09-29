import { NextRequest, NextResponse } from 'next/server';
import { projectServerService } from '@/services/projectService.server';
import { withApiAuth } from '@/lib/apiAuth';
import { getIssuesByProjectId, getUserById } from '@/lib/db/queries';

// Define the Issue interface to match the frontend
interface User {
  id: string;
  userId: string;
  name: string;
  email: string;
  createdAt: Date;
  avatarUrl?: string;
}

type IssueSeverity = 'low' | 'medium' | 'high' | 'critical';
type IssueStatus = 'open' | 'in-progress' | 'resolved' | 'closed';

interface Issue {
  id: string;
  title: string;
  description: string;
  severity: IssueSeverity;
  status: IssueStatus;
  reporter: User;
  assignee: User | null;
  createdAt: string;
  updatedAt: string;
  comments: number;
  upvotes: number;
  affectedTasks: number;
  category: string;
  tags: string[];
}

export const GET = withApiAuth(async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const resolvedParams = await params;
    const { projectId } = resolvedParams;
    
    // Get project data to verify access and get related information
    const project = await projectServerService.getProject(projectId);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Fetch issues from database
    const dbIssues = await getIssuesByProjectId(projectId);
    
    // Transform database issues to match frontend interface
    const issues: Issue[] = await Promise.all(dbIssues.map(async (dbIssue) => {
      // Get reporter information
      let reporter: User = {
        id: 'unknown',
        userId: 'unknown',
        name: 'Unknown User',
        email: 'unknown@example.com',
        createdAt: new Date(),
      };
      
      const reporterData = await getUserById(dbIssue.reporterId);
      if (reporterData) {
        reporter = {
          id: reporterData.id,
          userId: reporterData.userId,
          name: reporterData.name,
          email: reporterData.email,
          createdAt: new Date(reporterData.createdAt),
          avatarUrl: reporterData.avatarUrl || undefined
        };
      }
      
      // Get assignee information
      let assignee: User | null = null;
      if (dbIssue.assigneeId) {
        const assigneeData = await getUserById(dbIssue.assigneeId);
        if (assigneeData) {
          assignee = {
            id: assigneeData.id,
            userId: assigneeData.userId,
            name: assigneeData.name,
            email: assigneeData.email,
            createdAt: new Date(assigneeData.createdAt),
            avatarUrl: assigneeData.avatarUrl || undefined
          };
        }
      }
      
      return {
        id: dbIssue.id,
        title: dbIssue.title,
        description: dbIssue.description,
        severity: dbIssue.severity as IssueSeverity,
        status: dbIssue.status as IssueStatus,
        reporter,
        assignee,
        createdAt: dbIssue.createdAt,
        updatedAt: dbIssue.updatedAt,
        comments: dbIssue.commentsCount,
        upvotes: dbIssue.upvotes,
        affectedTasks: dbIssue.affectedTasks,
        category: dbIssue.category,
        tags: dbIssue.tags ? JSON.parse(dbIssue.tags as unknown as string) : []
      };
    }));

    return NextResponse.json(issues);
  } catch (error: any) {
    console.error('Error fetching issues:', error);
    const errorMessage = error.message || 'Failed to fetch issues';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
});