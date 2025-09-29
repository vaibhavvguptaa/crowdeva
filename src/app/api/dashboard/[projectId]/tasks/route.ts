import { NextRequest, NextResponse } from 'next/server';
import { projectServerService } from '@/services/projectService.server';
import { withApiAuth } from '@/lib/apiAuth';
import { getTasksByProjectId, getUserById } from '@/lib/db/queries';

// Define the Task interface to match the frontend
interface User {
  id: string;
  userId: string;
  name: string;
  email: string;
  createdAt: Date;
  avatarUrl?: string;
}

type TaskStatus = 'completed' | 'in-progress' | 'pending';
type TaskPriority = 'high' | 'medium' | 'low';

interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee: User;
  estimatedTime: string;
  actualTime: string;
  dueDate: string;
  progress: number;
  labels?: string[];
  comments: number;
  upvotes: number;
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

    // Fetch tasks from database
    const dbTasks = await getTasksByProjectId(projectId);
    
    // Transform database tasks to match frontend interface
    const tasks: Task[] = await Promise.all(dbTasks.map(async (dbTask) => {
      // Get assignee information
      let assignee: User = {
        id: 'unknown',
        userId: 'unknown',
        name: 'Unassigned',
        email: 'unassigned@example.com',
        createdAt: new Date(),
      };
      
      if (dbTask.assigneeId) {
        const assigneeData = await getUserById(dbTask.assigneeId);
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
        id: dbTask.id,
        title: dbTask.title,
        description: dbTask.description,
        status: dbTask.status as TaskStatus,
        priority: dbTask.priority === 'high' ? 'high' : dbTask.priority === 'medium' ? 'medium' : 'low',
        assignee,
        estimatedTime: dbTask.estimatedTime || '0 min',
        actualTime: dbTask.actualTime || '0 min',
        dueDate: dbTask.dueDate ? new Date(dbTask.dueDate).toISOString().split('T')[0] : '',
        progress: dbTask.progress,
        labels: dbTask.labels ? JSON.parse(dbTask.labels as unknown as string) : [],
        comments: dbTask.commentsCount,
        upvotes: dbTask.upvotes
      };
    }));

    return NextResponse.json(tasks);
  } catch (error: any) {
    console.error('Error fetching tasks:', error);
    const errorMessage = error.message || 'Failed to fetch tasks';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
});