import pool from './connection';
import { ProjectWithMetrics, ProjectAssignee, UserRole, ProjectRBAC } from '@/types';

// Check if database is available
const isDatabaseAvailable = async (): Promise<boolean> => {
  if (!pool) return false;
  
  try {
    // Try to get a connection from the pool
    const connection = await pool.getConnection();
    connection.release();
    return true;
  } catch (error) {
    console.warn('Database not available:', (error as Error).message);
    return false;
  }
};

// Helper function to convert undefined values to null for database queries
const sanitizeParams = (params: unknown[]): unknown[] => {
  return params.map(param => param === undefined ? null : param);
};

// User queries
export const getUsers = async (): Promise<ProjectAssignee[]> => {
  if (!pool || !(await isDatabaseAvailable())) {
    // Return empty array instead of mock data when database is not available
    return [];
  }
  
  try {
    const query = 'SELECT * FROM users LIMIT 1000'; // Add reasonable limit
    const [rows] = await pool.execute(query);
    return rows as ProjectAssignee[];
  } catch (error) {
    console.error('Error fetching users from database:', error);
    throw error;
  }
};

export const getUserById = async (id: string): Promise<ProjectAssignee | null> => {
  if (!pool || !(await isDatabaseAvailable())) {
    // Return null instead of mock data when database is not available
    return null;
  }
  
  try {
    // Helper function to convert undefined to null
    const convertUndefinedToNull = (value: unknown) => value === undefined ? null : value;
    
    const query = 'SELECT * FROM users WHERE id = ?';
    const [rows] = await pool.execute(query, [convertUndefinedToNull(id)]);
    const users = rows as ProjectAssignee[];
    return users.length > 0 ? users[0] : null;
  } catch (error) {
    console.error('Error fetching user from database:', error);
    throw error;
  }
};

// Project queries
export const getProjects = async (userId?: string): Promise<ProjectWithMetrics[]> => {
  if (!pool || !(await isDatabaseAvailable())) {
    // Return empty array instead of mock data when database is not available
    return [];
  }
  
  try {
    let query = `
      SELECT p.*, 
             CASE 
               WHEN COUNT(pa.assignee) = 0 THEN JSON_ARRAY()
               ELSE JSON_ARRAYAGG(pa.assignee)
             END as assignees,
             JSON_OBJECT(
               'totalTasks', pm.total_tasks,
               'completedTasks', pm.completed_tasks,
               'accuracy', pm.accuracy,
               'avgTimePerTask', pm.avg_time_per_task,
               'issuesFound', pm.issues_found,
               'qualityScore', pm.quality_score,
               'lastActivityAt', pm.last_activity_at
             ) as metrics,
             JSON_OBJECT(
               'owner', pr.owner,
               'admins', pr.admins,
               'managers', pr.managers,
               'developers', pr.developers,
               'vendors', pr.vendors,
               'evaluators', pr.evaluators,
               'viewers', pr.viewers
             ) as rbac
      FROM projects p
      LEFT JOIN project_assignees pa ON p.id = pa.project_id
      LEFT JOIN project_metrics pm ON p.id = pm.project_id
      LEFT JOIN project_rbac pr ON p.id = pr.project_id
    `;
    
    const params: unknown[] = [];
    
    if (userId) {
      query += `
        WHERE p.id IN (
          SELECT project_id FROM project_rbac 
          WHERE owner = ? OR 
                (admins IS NOT NULL AND JSON_CONTAINS(CAST(admins AS CHAR), JSON_QUOTE(?))) OR 
                (managers IS NOT NULL AND JSON_CONTAINS(CAST(managers AS CHAR), JSON_QUOTE(?))) OR 
                (developers IS NOT NULL AND JSON_CONTAINS(CAST(developers AS CHAR), JSON_QUOTE(?))) OR 
                (vendors IS NOT NULL AND JSON_CONTAINS(CAST(vendors AS CHAR), JSON_QUOTE(?))) OR 
                (evaluators IS NOT NULL AND JSON_CONTAINS(CAST(evaluators AS CHAR), JSON_QUOTE(?))) OR 
                (viewers IS NOT NULL AND JSON_CONTAINS(CAST(viewers AS CHAR), JSON_QUOTE(?)))
        )
      `;
      // Ensure userId is not undefined
      const safeUserId = userId === undefined ? null : userId;
      params.push(safeUserId, safeUserId, safeUserId, safeUserId, safeUserId, safeUserId, safeUserId);
    }
    
    query += ' GROUP BY p.id, pm.project_id, pr.project_id ORDER BY p.created_at DESC LIMIT 100'; // Add ordering and limit
    
    const [rows] = await pool.execute(query, params);
    return rows as ProjectWithMetrics[];
  } catch (error) {
    console.error('Error fetching projects from database:', error);
    throw error;
  }
};

export const getProjectById = async (id: string): Promise<ProjectWithMetrics | null> => {
  if (!pool || !(await isDatabaseAvailable())) {
    // Return null instead of mock data when database is not available
    return null;
  }
  
  try {
    // Helper function to convert undefined to null
    const convertUndefinedToNull = (value: unknown) => value === undefined ? null : value;
    
    const query = `
      SELECT p.*, 
             CASE 
               WHEN COUNT(pa.assignee) = 0 THEN JSON_ARRAY()
               ELSE JSON_ARRAYAGG(pa.assignee)
             END as assignees,
             JSON_OBJECT(
               'totalTasks', pm.total_tasks,
               'completedTasks', pm.completed_tasks,
               'accuracy', pm.accuracy,
               'avgTimePerTask', pm.avg_time_per_task,
               'issuesFound', pm.issues_found,
               'qualityScore', pm.quality_score,
               'lastActivityAt', pm.last_activity_at
             ) as metrics,
             JSON_OBJECT(
               'owner', pr.owner,
               'admins', pr.admins,
               'managers', pr.managers,
               'developers', pr.developers,
               'vendors', pr.vendors,
               'evaluators', pr.evaluators,
               'viewers', pr.viewers
             ) as rbac
      FROM projects p
      LEFT JOIN project_assignees pa ON p.id = pa.project_id
      LEFT JOIN project_metrics pm ON p.id = pm.project_id
      LEFT JOIN project_rbac pr ON p.id = pr.project_id
      WHERE p.id = ?
      GROUP BY p.id, pm.project_id, pr.project_id
    `;
    const [rows] = await pool.execute(query, [convertUndefinedToNull(id)]);
    
    const projects = rows as ProjectWithMetrics[];
    return projects.length > 0 ? projects[0] : null;
  } catch (error) {
    console.error('Error fetching project from database:', error);
    throw error;
  }
};

export const createProject = async (projectData: Record<string, unknown>): Promise<ProjectWithMetrics> => {
  if (!pool || !(await isDatabaseAvailable())) {
    // Throw error instead of using mock data when database is not available
    throw new Error('Database not available for creating project');
  }
  
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Helper function to convert undefined to null
    const convertUndefinedToNull = (value: unknown) => value === undefined ? null : value;
    
    // Helper function to format dates for MySQL
    const formatDateTime = (date: string | Date | undefined): string | null => {
      if (!date) return null;
      if (typeof date === 'string' && date.includes('T')) {
        // Convert ISO string to MySQL datetime format
        return date.slice(0, 19).replace('T', ' ');
      }
      if (date instanceof Date) {
        return date.toISOString().slice(0, 19).replace('T', ' ');
      }
      return date as string;
    };
    
    // Insert project
    const projectQuery = 'INSERT INTO projects (id, name, description, status, created_by, type, priority, deadline, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    await connection.execute(projectQuery,
      [
        convertUndefinedToNull(projectData.id),
        convertUndefinedToNull(projectData.name),
        convertUndefinedToNull(projectData.description),
        convertUndefinedToNull(projectData.status),
        convertUndefinedToNull(projectData.createdBy),
        convertUndefinedToNull(projectData.type),
        convertUndefinedToNull(projectData.priority),
        formatDateTime(projectData.deadline as string | Date | undefined),
        formatDateTime(projectData.createdAt as string | Date | undefined) || new Date().toISOString().slice(0, 19).replace('T', ' '),
        formatDateTime(projectData.updatedAt as string | Date | undefined) || new Date().toISOString().slice(0, 19).replace('T', ' ')
      ]
    );
    
    // Insert project metrics
    const metricsQuery = 'INSERT INTO project_metrics (project_id, total_tasks, completed_tasks, accuracy, avg_time_per_task, issues_found, quality_score, last_activity_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
    await connection.execute(metricsQuery,
      [
        convertUndefinedToNull(projectData.id),
        convertUndefinedToNull((projectData.metrics as Record<string, unknown>)?.totalTasks),
        convertUndefinedToNull((projectData.metrics as Record<string, unknown>)?.completedTasks),
        convertUndefinedToNull((projectData.metrics as Record<string, unknown>)?.accuracy),
        convertUndefinedToNull((projectData.metrics as Record<string, unknown>)?.avgTimePerTask),
        convertUndefinedToNull((projectData.metrics as Record<string, unknown>)?.issuesFound),
        convertUndefinedToNull((projectData.metrics as Record<string, unknown>)?.qualityScore),
        formatDateTime((projectData.metrics as Record<string, unknown>)?.lastActivityAt as string | Date | undefined)
      ]
    );
    
    // Insert project RBAC
    const rbacQuery = 'INSERT INTO project_rbac (project_id, owner, admins, managers, developers, vendors, evaluators, viewers) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
    await connection.execute(rbacQuery,
      [
        convertUndefinedToNull(projectData.id),
        convertUndefinedToNull((projectData.rbac as Record<string, unknown>)?.owner),
        JSON.stringify((projectData.rbac as Record<string, unknown>)?.admins || []),
        JSON.stringify((projectData.rbac as Record<string, unknown>)?.managers || []),
        JSON.stringify((projectData.rbac as Record<string, unknown>)?.developers || []),
        JSON.stringify((projectData.rbac as Record<string, unknown>)?.vendors || []),
        JSON.stringify((projectData.rbac as Record<string, unknown>)?.evaluators || []),
        JSON.stringify((projectData.rbac as Record<string, unknown>)?.viewers || [])
      ]
    );
    
    // Insert project assignees
    const assignees = (projectData.assignees as unknown[]) || [];
    const assigneeQuery = 'INSERT INTO project_assignees (project_id, assignee) VALUES (?, ?)';
    for (const assignee of assignees) {
      await connection.execute(assigneeQuery,
        [convertUndefinedToNull(projectData.id), JSON.stringify(assignee)]
      );
    }
    
    await connection.commit();
    
    // Return the created project
    return await getProjectById(projectData.id as string) as ProjectWithMetrics;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// Task queries
export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: 'completed' | 'in-progress' | 'pending';
  priority: 'low' | 'medium' | 'high';
  assigneeId: string | null;
  estimatedTime: string | null;
  actualTime: string | null;
  dueDate: string | null;
  progress: number;
  labels: string[] | null;
  commentsCount: number;
  upvotes: number;
  createdAt: string;
  updatedAt: string;
}

export interface Issue {
  id: string;
  projectId: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  reporterId: string;
  assigneeId: string | null;
  category: string;
  tags: string[] | null;
  commentsCount: number;
  upvotes: number;
  affectedTasks: number;
  createdAt: string;
  updatedAt: string;
}

export const getTasksByProjectId = async (projectId: string): Promise<Task[]> => {
  if (!pool || !(await isDatabaseAvailable())) {
    return [];
  }
  
  try {
    const convertUndefinedToNull = (value: unknown) => value === undefined ? null : value;
    
    const query = `
      SELECT 
        id,
        project_id as projectId,
        title,
        description,
        status,
        priority,
        assignee_id as assigneeId,
        estimated_time as estimatedTime,
        actual_time as actualTime,
        due_date as dueDate,
        progress,
        labels,
        comments_count as commentsCount,
        upvotes,
        created_at as createdAt,
        updated_at as updatedAt
      FROM tasks 
      WHERE project_id = ?
      ORDER BY due_date ASC, created_at DESC
    `;
    
    const [rows] = await pool.execute(query, [convertUndefinedToNull(projectId)]);
    return rows as Task[];
  } catch (error) {
    console.error('Error fetching tasks from database:', error);
    throw error;
  }
};

export const getIssuesByProjectId = async (projectId: string): Promise<Issue[]> => {
  if (!pool || !(await isDatabaseAvailable())) {
    return [];
  }
  
  try {
    const convertUndefinedToNull = (value: unknown) => value === undefined ? null : value;
    
    const query = `
      SELECT 
        id,
        project_id as projectId,
        title,
        description,
        severity,
        status,
        reporter_id as reporterId,
        assignee_id as assigneeId,
        category,
        tags,
        comments_count as commentsCount,
        upvotes,
        affected_tasks as affectedTasks,
        created_at as createdAt,
        updated_at as updatedAt
      FROM issues 
      WHERE project_id = ?
      ORDER BY updated_at DESC, created_at DESC
    `;
    
    const [rows] = await pool.execute(query, [convertUndefinedToNull(projectId)]);
    return rows as Issue[];
  } catch (error) {
    console.error('Error fetching issues from database:', error);
    throw error;
  }
};

export const updateProject = async (id: string, updates: Partial<ProjectWithMetrics>): Promise<ProjectWithMetrics | null> => {
  if (!pool || !(await isDatabaseAvailable())) {
    // Throw error instead of using mock data when database is not available
    throw new Error('Database not available for updating project');
  }
  
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Helper function to convert undefined to null
    const convertUndefinedToNull = (value: unknown) => value === undefined ? null : value;
    
    // Update project
    const updateFields: string[] = [];
    const updateParams: unknown[] = [];
    
    if (updates.name !== undefined) {
      updateFields.push('name = ?');
      updateParams.push(convertUndefinedToNull(updates.name));
    }
    
    if (updates.description !== undefined) {
      updateFields.push('description = ?');
      updateParams.push(convertUndefinedToNull(updates.description));
    }
    
    if (updates.status !== undefined) {
      updateFields.push('status = ?');
      updateParams.push(convertUndefinedToNull(updates.status));
    }
    
    if (updates.type !== undefined) {
      updateFields.push('type = ?');
      updateParams.push(convertUndefinedToNull(updates.type));
    }
    
    if (updates.priority !== undefined) {
      updateFields.push('priority = ?');
      updateParams.push(convertUndefinedToNull(updates.priority));
    }
    
    if (updates.deadline !== undefined) {
      updateFields.push('deadline = ?');
      updateParams.push(convertUndefinedToNull(updates.deadline));
    }
    
    updateFields.push('updated_at = ?');
    updateParams.push(new Date().toISOString().slice(0, 19).replace('T', ' '));
    
    if (updateFields.length > 0) {
      const query = `UPDATE projects SET ${updateFields.join(', ')} WHERE id = ?`;
      updateParams.push(id);
      await connection.execute(query, updateParams);
    }
    
    // Update project metrics if provided
    if (updates.metrics) {
      const metricFields: string[] = [];
      const metricParams: unknown[] = [];
      
      if (updates.metrics.totalTasks !== undefined) {
        metricFields.push('total_tasks = ?');
        metricParams.push(convertUndefinedToNull(updates.metrics.totalTasks));
      }
      
      if (updates.metrics.completedTasks !== undefined) {
        metricFields.push('completed_tasks = ?');
        metricParams.push(convertUndefinedToNull(updates.metrics.completedTasks));
      }
      
      if (updates.metrics.accuracy !== undefined) {
        metricFields.push('accuracy = ?');
        metricParams.push(convertUndefinedToNull(updates.metrics.accuracy));
      }
      
      if (updates.metrics.avgTimePerTask !== undefined) {
        metricFields.push('avg_time_per_task = ?');
        metricParams.push(convertUndefinedToNull(updates.metrics.avgTimePerTask));
      }
      
      if (updates.metrics.issuesFound !== undefined) {
        metricFields.push('issues_found = ?');
        metricParams.push(convertUndefinedToNull(updates.metrics.issuesFound));
      }
      
      if (updates.metrics.qualityScore !== undefined) {
        metricFields.push('quality_score = ?');
        metricParams.push(convertUndefinedToNull(updates.metrics.qualityScore));
      }
      
      if (updates.metrics.lastActivityAt !== undefined) {
        metricFields.push('last_activity_at = ?');
        metricParams.push(convertUndefinedToNull(updates.metrics.lastActivityAt));
      }
      
      if (metricFields.length > 0) {
        const query = `UPDATE project_metrics SET ${metricFields.join(', ')} WHERE project_id = ?`;
        metricParams.push(id);
        await connection.execute(query, metricParams);
      }
    }
    
    // Update project RBAC if provided
    if (updates.rbac) {
      const rbacFields: string[] = [];
      const rbacParams: unknown[] = [];
      
      if (updates.rbac.owner !== undefined) {
        rbacFields.push('owner = ?');
        rbacParams.push(convertUndefinedToNull(updates.rbac.owner));
      }
      
      if (updates.rbac.admins !== undefined) {
        rbacFields.push('admins = ?');
        rbacParams.push(JSON.stringify(updates.rbac.admins));
      }
      
      if (updates.rbac.managers !== undefined) {
        rbacFields.push('managers = ?');
        rbacParams.push(JSON.stringify(updates.rbac.managers));
      }
      
      if (updates.rbac.developers !== undefined) {
        rbacFields.push('developers = ?');
        rbacParams.push(JSON.stringify(updates.rbac.developers));
      }
      
      if (updates.rbac.vendors !== undefined) {
        rbacFields.push('vendors = ?');
        rbacParams.push(JSON.stringify(updates.rbac.vendors));
      }
      
      if (updates.rbac.evaluators !== undefined) {
        rbacFields.push('evaluators = ?');
        rbacParams.push(JSON.stringify(updates.rbac.evaluators));
      }
      
      if (updates.rbac.viewers !== undefined) {
        rbacFields.push('viewers = ?');
        rbacParams.push(JSON.stringify(updates.rbac.viewers));
      }
      
      if (rbacFields.length > 0) {
        const query = `UPDATE project_rbac SET ${rbacFields.join(', ')} WHERE project_id = ?`;
        rbacParams.push(id);
        await connection.execute(query, rbacParams);
      }
    }
    
    // Update project assignees if provided
    if (updates.assignees) {
      // Delete existing assignees
      const deleteQuery = 'DELETE FROM project_assignees WHERE project_id = ?';
      await connection.execute(deleteQuery, [id]);
      
      // Insert new assignees
      const insertQuery = 'INSERT INTO project_assignees (project_id, assignee) VALUES (?, ?)';
      for (const assignee of updates.assignees) {
        await connection.execute(insertQuery,
          [id, JSON.stringify(assignee)]
        );
      }
    }
    
    await connection.commit();
    
    // Return the updated project
    return await getProjectById(id);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export const deleteProject = async (id: string): Promise<boolean> => {
  if (!pool || !(await isDatabaseAvailable())) {
    // Throw error instead of using mock data when database is not available
    throw new Error('Database not available for deleting project');
  }
  
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Helper function to convert undefined to null
    const convertUndefinedToNull = (value: unknown) => value === undefined ? null : value;
    
    // Delete related records first (due to foreign key constraints)
    const assigneeQuery = 'DELETE FROM project_assignees WHERE project_id = ?';
    await connection.execute(assigneeQuery, [convertUndefinedToNull(id)]);
    
    const metricsQuery = 'DELETE FROM project_metrics WHERE project_id = ?';
    await connection.execute(metricsQuery, [convertUndefinedToNull(id)]);
    
    const rbacQuery = 'DELETE FROM project_rbac WHERE project_id = ?';
    await connection.execute(rbacQuery, [convertUndefinedToNull(id)]);
    
    const evaluationQuery = 'DELETE FROM evaluation_structures WHERE project_id = ?';
    await connection.execute(evaluationQuery, [convertUndefinedToNull(id)]);
    
    // Delete the project
    const projectQuery = 'DELETE FROM projects WHERE id = ?';
    const [result] = await connection.execute(projectQuery, [convertUndefinedToNull(id)]);
    
    await connection.commit();
    
    // @ts-expect-error: result is a mysql2 RowDataPacket[] which has affectedRows property
    return result.affectedRows > 0;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export const getUserProjectRole = async (projectId: string, userId: string): Promise<UserRole | null> => {
  if (!pool || !(await isDatabaseAvailable())) {
    // Return null instead of mock data when database is not available
    return null;
  }
  
  try {
    // Helper function to convert undefined to null
    const convertUndefinedToNull = (value: unknown) => value === undefined ? null : value;
    
    const query = `
      SELECT owner, admins, managers, developers, vendors, evaluators, viewers
      FROM project_rbac
      WHERE project_id = ?
    `;
    const [rows] = await pool.execute(query, [convertUndefinedToNull(projectId)]);
    
    const rbacRecords = rows as unknown[];
    if (rbacRecords.length === 0) return null;
    
    const rbac = rbacRecords[0] as Record<string, unknown>;
    
    if (rbac.owner === userId) return 'owner';
    try {
      if (rbac.admins && JSON.parse(rbac.admins as string).includes(userId)) return 'admin';
    } catch (e) {
      console.warn('Error parsing admins JSON:', e);
    }
    try {
      if (rbac.managers && JSON.parse(rbac.managers as string).includes(userId)) return 'manager';
    } catch (e) {
      console.warn('Error parsing managers JSON:', e);
    }
    try {
      if (rbac.developers && JSON.parse(rbac.developers as string).includes(userId)) return 'developer';
    } catch (e) {
      console.warn('Error parsing developers JSON:', e);
    }
    try {
      if (rbac.vendors && JSON.parse(rbac.vendors as string).includes(userId)) return 'vendor';
    } catch (e) {
      console.warn('Error parsing vendors JSON:', e);
    }
    try {
      if (rbac.evaluators && JSON.parse(rbac.evaluators as string).includes(userId)) return 'evaluator';
    } catch (e) {
      console.warn('Error parsing evaluators JSON:', e);
    }
    try {
      if (rbac.viewers && JSON.parse(rbac.viewers as string).includes(userId)) return 'viewer';
    } catch (e) {
      console.warn('Error parsing viewers JSON:', e);
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching user project role from database:', error);
    throw error;
  }
};

export const updateProjectRBAC = async (projectId: string, rbac: Partial<ProjectRBAC>): Promise<boolean> => {
  if (!pool || !(await isDatabaseAvailable())) {
    // Throw error instead of using mock data when database is not available
    throw new Error('Database not available for updating project RBAC');
  }
  
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Helper function to convert undefined to null
    const convertUndefinedToNull = (value: unknown) => value === undefined ? null : value;
    
    const updateFields: string[] = [];
    const updateParams: unknown[] = [];
    
    if (rbac.owner !== undefined) {
      updateFields.push('owner = ?');
      updateParams.push(convertUndefinedToNull(rbac.owner));
    }
    
    if (rbac.admins !== undefined) {
      updateFields.push('admins = ?');
      updateParams.push(JSON.stringify(rbac.admins));
    }
    
    if (rbac.managers !== undefined) {
      updateFields.push('managers = ?');
      updateParams.push(JSON.stringify(rbac.managers));
    }
    
    if (rbac.developers !== undefined) {
      updateFields.push('developers = ?');
      updateParams.push(JSON.stringify(rbac.developers));
    }
    
    if (rbac.vendors !== undefined) {
      updateFields.push('vendors = ?');
      updateParams.push(JSON.stringify(rbac.vendors));
    }
    
    if (rbac.evaluators !== undefined) {
      updateFields.push('evaluators = ?');
      updateParams.push(JSON.stringify(rbac.evaluators));
    }
    
    if (rbac.viewers !== undefined) {
      updateFields.push('viewers = ?');
      updateParams.push(JSON.stringify(rbac.viewers));
    }
    
    if (updateFields.length > 0) {
      const query = `UPDATE project_rbac SET ${updateFields.join(', ')} WHERE project_id = ?`;
      updateParams.push(projectId);
      await connection.execute(query, updateParams);
    }
    
    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// Evaluation structure queries
export const saveEvaluationStructure = async (projectId: string, evaluationStructure: Record<string, unknown>): Promise<boolean> => {
  if (!pool || !(await isDatabaseAvailable())) {
    // Throw error instead of using mock data when database is not available
    throw new Error('Database not available for saving evaluation structure');
  }
  
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Helper function to convert undefined to null
    const convertUndefinedToNull = (value: unknown) => value === undefined ? null : value;
    
    // Check if evaluation structure already exists
    const checkQuery = 'SELECT project_id FROM evaluation_structures WHERE project_id = ?';
    const [rows] = await connection.execute(checkQuery, [convertUndefinedToNull(projectId)]);
    const existing = rows as unknown[];
    
    if (existing.length > 0) {
      // Update existing evaluation structure
      const updateQuery = 'UPDATE evaluation_structures SET structure = ?, updated_at = ? WHERE project_id = ?';
      await connection.execute(updateQuery,
        [JSON.stringify(evaluationStructure), new Date().toISOString().slice(0, 19).replace('T', ' '), convertUndefinedToNull(projectId)]
      );
    } else {
      // Insert new evaluation structure
      const insertQuery = 'INSERT INTO evaluation_structures (project_id, structure, created_at, updated_at) VALUES (?, ?, ?, ?)';
      await connection.execute(insertQuery,
        [convertUndefinedToNull(projectId), JSON.stringify(evaluationStructure), new Date().toISOString().slice(0, 19).replace('T', ' '), new Date().toISOString().slice(0, 19).replace('T', ' ')]
      );
    }
    
    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export const getEvaluationStructure = async (projectId: string): Promise<unknown | null> => {
  if (!pool || !(await isDatabaseAvailable())) {
    // Return null instead of mock data when database is not available
    return null;
  }
  
  try {
    // Helper function to convert undefined to null
    const convertUndefinedToNull = (value: unknown) => value === undefined ? null : value;
    
    const query = 'SELECT structure FROM evaluation_structures WHERE project_id = ?';
    const [rows] = await pool.execute(query, [convertUndefinedToNull(projectId)]);
    const structures = rows as unknown[];
    
    if (structures.length === 0) return null;
    
    return JSON.parse(structures[0] as string);
  } catch (error) {
    console.error('Error fetching evaluation structure from database:', error);
    throw error;
  }
};

// Project settings interface
export interface ProjectSettings {
  general: {
    projectName: string;
    description: string;
    autoSave: boolean;
    taskTimeout: number;
  };
  notifications: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    taskAssignments: boolean;
    issueAlerts: boolean;
    weeklyReports: boolean;
    systemUpdates: boolean;
  };
  privacy: {
    dataRetention: string;
    anonymizeData: boolean;
    shareAnalytics: boolean;
    publicProfile: boolean;
  };
  team: {
    maxAnnotators: number;
    requireApproval: boolean;
    allowGuestAccess: boolean;
    defaultRole: string;
    enableSubAdmins: boolean;
    subAdminPermissions: {
      manageTeam: boolean;
      viewAnalytics: boolean;
      exportData: boolean;
      manageSettings: boolean;
    };
  };
  vendor: {
    enableVendorOnboarding: boolean;
    requireDocumentVerification: boolean;
    autoApproveVerified: boolean;
    onboardingSteps: string[];
  };
}

// Project settings queries
export const createProjectSettings = async (projectId: string, settings: ProjectSettings): Promise<boolean> => {
  if (!pool || !(await isDatabaseAvailable())) {
    throw new Error('Database not available for creating project settings');
  }

  try {
    console.log('DB Queries: Creating project settings for project', projectId);
    const convertUndefinedToNull = (value: unknown) => value === undefined ? null : value;
    
    const query = `
      INSERT INTO project_settings (project_id, general_settings, notification_settings, privacy_settings, team_settings, vendor_settings)
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
      general_settings = VALUES(general_settings),
      notification_settings = VALUES(notification_settings),
      privacy_settings = VALUES(privacy_settings),
      team_settings = VALUES(team_settings),
      vendor_settings = VALUES(vendor_settings),
      updated_at = CURRENT_TIMESTAMP
    `;
    
    const params = [
      convertUndefinedToNull(projectId),
      JSON.stringify(settings.general),
      JSON.stringify(settings.notifications),
      JSON.stringify(settings.privacy),
      JSON.stringify(settings.team),
      JSON.stringify(settings.vendor)
    ];
    
    const [result] = await pool.execute(query, params);
    console.log('DB Queries: Project settings creation result', result);
    
    // @ts-expect-error: result is a mysql2 RowDataPacket[] which has affectedRows property
    return result.affectedRows > 0;
  } catch (error) {
    console.error('DB Queries: Error creating project settings in database:', error);
    throw error;
  }
};

export const getProjectSettings = async (projectId: string): Promise<ProjectSettings | null> => {
  if (!pool || !(await isDatabaseAvailable())) {
    throw new Error('Database not available for fetching project settings');
  }

  try {
    console.log('DB Queries: Fetching project settings for project', projectId);
    const convertUndefinedToNull = (value: unknown) => value === undefined ? null : value;
    
    const query = `
      SELECT general_settings, notification_settings, privacy_settings, team_settings, vendor_settings
      FROM project_settings
      WHERE project_id = ?
    `;
    
    const [rows] = await pool.execute(query, [convertUndefinedToNull(projectId)]);
    const settingsRecords = rows as unknown[];
    console.log('DB Queries: Found', settingsRecords.length, 'settings records');
    
    if (settingsRecords.length === 0) {
      console.log('DB Queries: No settings found for project', projectId);
      return null;
    }
    
    const record = settingsRecords[0] as Record<string, unknown>;
    
    const result = {
      general: JSON.parse(record.general_settings as string),
      notifications: JSON.parse(record.notification_settings as string),
      privacy: JSON.parse(record.privacy_settings as string),
      team: JSON.parse(record.team_settings as string),
      vendor: JSON.parse(record.vendor_settings as string)
    };
    
    console.log('DB Queries: Successfully parsed settings for project', projectId);
    return result;
  } catch (error) {
    console.error('DB Queries: Error fetching project settings from database:', error);
    throw error;
  }
};

export const updateProjectSettings = async (projectId: string, settings: Partial<ProjectSettings>): Promise<boolean> => {
  if (!pool || !(await isDatabaseAvailable())) {
    throw new Error('Database not available for updating project settings');
  }

  try {
    const convertUndefinedToNull = (value: unknown) => value === undefined ? null : value;
    
    const updateFields: string[] = [];
    const updateParams: unknown[] = [];
    
    if (settings.general !== undefined) {
      updateFields.push('general_settings = ?');
      updateParams.push(JSON.stringify(settings.general));
    }
    
    if (settings.notifications !== undefined) {
      updateFields.push('notification_settings = ?');
      updateParams.push(JSON.stringify(settings.notifications));
    }
    
    if (settings.privacy !== undefined) {
      updateFields.push('privacy_settings = ?');
      updateParams.push(JSON.stringify(settings.privacy));
    }
    
    if (settings.team !== undefined) {
      updateFields.push('team_settings = ?');
      updateParams.push(JSON.stringify(settings.team));
    }
    
    if (settings.vendor !== undefined) {
      updateFields.push('vendor_settings = ?');
      updateParams.push(JSON.stringify(settings.vendor));
    }
    
    if (updateFields.length === 0) {
      return true; // Nothing to update
    }
    
    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateParams.push(convertUndefinedToNull(projectId));
    
    const query = `
      UPDATE project_settings
      SET ${updateFields.join(', ')}
      WHERE project_id = ?
    `;
    
    const [result] = await pool.execute(query, updateParams);
    
    // @ts-expect-error: result is a mysql2 RowDataPacket[] which has affectedRows property
    return result.affectedRows > 0;
  } catch (error) {
    console.error('Error updating project settings in database:', error);
    throw error;
  }
};

// Evaluation projects interface
export interface EvaluationProject {
  id: string;
  projectId: string;
  name: string;
  description: string;
  modelName: string;
  evaluationType: "performance" | "safety" | "bias" | "robustness" | "custom";
  status: "running" | "completed" | "paused" | "failed" | "pending";
  progress: number;
  accuracy?: number;
  f1Score?: number;
  latency?: number;
  testCases: number;
  completedTests: number;
  dataset: string;
  evaluationMetrics: string[];
  createdBy: string;
  assignedTo: string[];
  createdAt: string;
  updatedAt: string;
  lastRunAt?: string;
  estimatedCompletion?: string;
}

// Evaluation projects queries
export const getEvaluationProjectsByProjectId = async (projectId: string): Promise<EvaluationProject[]> => {
  if (!pool || !(await isDatabaseAvailable())) {
    return [];
  }
  
  try {
    const convertUndefinedToNull = (value: unknown) => value === undefined ? null : value;
    
    const query = `
      SELECT 
        id,
        project_id as projectId,
        name,
        description,
        model_name as modelName,
        evaluation_type as evaluationType,
        status,
        progress,
        accuracy,
        f1_score as f1Score,
        latency,
        test_cases as testCases,
        completed_tests as completedTests,
        dataset,
        evaluation_metrics as evaluationMetrics,
        created_by as createdBy,
        assigned_to as assignedTo,
        created_at as createdAt,
        updated_at as updatedAt,
        last_run_at as lastRunAt,
        estimated_completion as estimatedCompletion
      FROM evaluation_projects 
      WHERE project_id = ?
      ORDER BY created_at DESC
    `;
    
    const [rows] = await pool.execute(query, [convertUndefinedToNull(projectId)]);
    const dbProjects = rows as unknown[];
    
    // Transform database results to match the EvaluationProject interface
    return dbProjects.map((row: any) => ({
      id: row.id,
      projectId: row.projectId,
      name: row.name,
      description: row.description,
      modelName: row.modelName,
      evaluationType: row.evaluationType,
      status: row.status,
      progress: row.progress,
      accuracy: row.accuracy !== null ? Number(row.accuracy) : undefined,
      f1Score: row.f1Score !== null ? Number(row.f1Score) : undefined,
      latency: row.latency !== null ? Number(row.latency) : undefined,
      testCases: row.testCases,
      completedTests: row.completedTests,
      dataset: row.dataset,
      evaluationMetrics: row.evaluationMetrics ? JSON.parse(row.evaluationMetrics) : [],
      createdBy: row.createdBy,
      assignedTo: row.assignedTo ? JSON.parse(row.assignedTo) : [],
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      lastRunAt: row.lastRunAt,
      estimatedCompletion: row.estimatedCompletion
    }));
  } catch (error) {
    console.error('Error fetching evaluation projects from database:', error);
    throw error;
  }
};

export const createEvaluationProject = async (evaluationProject: Omit<EvaluationProject, 'id' | 'createdAt' | 'updatedAt'>): Promise<EvaluationProject> => {
  if (!pool || !(await isDatabaseAvailable())) {
    throw new Error('Database not available for creating evaluation project');
  }
  
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const convertUndefinedToNull = (value: unknown) => value === undefined ? null : value;
    
    // Generate a unique ID for the evaluation project
    const id = `eval-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const query = `
      INSERT INTO evaluation_projects (
        id, project_id, name, description, model_name, evaluation_type, status, progress,
        accuracy, f1_score, latency, test_cases, completed_tests, dataset, evaluation_metrics,
        created_by, assigned_to, created_at, updated_at, last_run_at, estimated_completion
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    
    await connection.execute(query, [
      id,
      convertUndefinedToNull(evaluationProject.projectId),
      convertUndefinedToNull(evaluationProject.name),
      convertUndefinedToNull(evaluationProject.description),
      convertUndefinedToNull(evaluationProject.modelName),
      convertUndefinedToNull(evaluationProject.evaluationType),
      convertUndefinedToNull(evaluationProject.status),
      convertUndefinedToNull(evaluationProject.progress),
      convertUndefinedToNull(evaluationProject.accuracy),
      convertUndefinedToNull(evaluationProject.f1Score),
      convertUndefinedToNull(evaluationProject.latency),
      convertUndefinedToNull(evaluationProject.testCases),
      convertUndefinedToNull(evaluationProject.completedTests),
      convertUndefinedToNull(evaluationProject.dataset),
      JSON.stringify(evaluationProject.evaluationMetrics),
      convertUndefinedToNull(evaluationProject.createdBy),
      JSON.stringify(evaluationProject.assignedTo),
      now,
      now,
      convertUndefinedToNull(evaluationProject.lastRunAt),
      convertUndefinedToNull(evaluationProject.estimatedCompletion)
    ]);
    
    await connection.commit();
    
    // Return the created evaluation project
    const createdProjects = await getEvaluationProjectsByProjectId(evaluationProject.projectId);
    const createdProject = createdProjects.find(p => p.id === id);
    
    if (!createdProject) {
      throw new Error('Failed to retrieve created evaluation project');
    }
    
    return createdProject;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export const updateEvaluationProject = async (id: string, updates: Partial<EvaluationProject>): Promise<EvaluationProject | null> => {
  if (!pool || !(await isDatabaseAvailable())) {
    throw new Error('Database not available for updating evaluation project');
  }
  
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const convertUndefinedToNull = (value: unknown) => value === undefined ? null : value;
    
    const updateFields: string[] = [];
    const updateParams: unknown[] = [];
    
    if (updates.name !== undefined) {
      updateFields.push('name = ?');
      updateParams.push(convertUndefinedToNull(updates.name));
    }
    
    if (updates.description !== undefined) {
      updateFields.push('description = ?');
      updateParams.push(convertUndefinedToNull(updates.description));
    }
    
    if (updates.modelName !== undefined) {
      updateFields.push('model_name = ?');
      updateParams.push(convertUndefinedToNull(updates.modelName));
    }
    
    if (updates.evaluationType !== undefined) {
      updateFields.push('evaluation_type = ?');
      updateParams.push(convertUndefinedToNull(updates.evaluationType));
    }
    
    if (updates.status !== undefined) {
      updateFields.push('status = ?');
      updateParams.push(convertUndefinedToNull(updates.status));
    }
    
    if (updates.progress !== undefined) {
      updateFields.push('progress = ?');
      updateParams.push(convertUndefinedToNull(updates.progress));
    }
    
    if (updates.accuracy !== undefined) {
      updateFields.push('accuracy = ?');
      updateParams.push(convertUndefinedToNull(updates.accuracy));
    }
    
    if (updates.f1Score !== undefined) {
      updateFields.push('f1_score = ?');
      updateParams.push(convertUndefinedToNull(updates.f1Score));
    }
    
    if (updates.latency !== undefined) {
      updateFields.push('latency = ?');
      updateParams.push(convertUndefinedToNull(updates.latency));
    }
    
    if (updates.testCases !== undefined) {
      updateFields.push('test_cases = ?');
      updateParams.push(convertUndefinedToNull(updates.testCases));
    }
    
    if (updates.completedTests !== undefined) {
      updateFields.push('completed_tests = ?');
      updateParams.push(convertUndefinedToNull(updates.completedTests));
    }
    
    if (updates.dataset !== undefined) {
      updateFields.push('dataset = ?');
      updateParams.push(convertUndefinedToNull(updates.dataset));
    }
    
    if (updates.evaluationMetrics !== undefined) {
      updateFields.push('evaluation_metrics = ?');
      updateParams.push(JSON.stringify(updates.evaluationMetrics));
    }
    
    if (updates.createdBy !== undefined) {
      updateFields.push('created_by = ?');
      updateParams.push(convertUndefinedToNull(updates.createdBy));
    }
    
    if (updates.assignedTo !== undefined) {
      updateFields.push('assigned_to = ?');
      updateParams.push(JSON.stringify(updates.assignedTo));
    }
    
    if (updates.lastRunAt !== undefined) {
      updateFields.push('last_run_at = ?');
      updateParams.push(convertUndefinedToNull(updates.lastRunAt));
    }
    
    if (updates.estimatedCompletion !== undefined) {
      updateFields.push('estimated_completion = ?');
      updateParams.push(convertUndefinedToNull(updates.estimatedCompletion));
    }
    
    updateFields.push('updated_at = ?');
    updateParams.push(new Date().toISOString().slice(0, 19).replace('T', ' '));
    
    if (updateFields.length > 0) {
      const query = `UPDATE evaluation_projects SET ${updateFields.join(', ')} WHERE id = ?`;
      updateParams.push(id);
      await connection.execute(query, updateParams);
    }
    
    await connection.commit();
    
    // Return the updated evaluation project
    const allProjects = await getEvaluationProjectsByProjectId(updates.projectId || '');
    return allProjects.find(p => p.id === id) || null;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export const deleteEvaluationProject = async (id: string): Promise<boolean> => {
  if (!pool || !(await isDatabaseAvailable())) {
    throw new Error('Database not available for deleting evaluation project');
  }
  
  try {
    const convertUndefinedToNull = (value: unknown) => value === undefined ? null : value;
    
    const query = 'DELETE FROM evaluation_projects WHERE id = ?';
    const [result] = await pool.execute(query, [convertUndefinedToNull(id)]);
    
    // @ts-expect-error: result is a mysql2 RowDataPacket[] which has affectedRows property
    return result.affectedRows > 0;
  } catch (error) {
    console.error('Error deleting evaluation project from database:', error);
    throw error;
  }
};

// Team member statistics interface
export interface TeamMemberStats {
  id: string;
  userId: string;
  name: string;
  email: string;
  avatarUrl?: string;
  tasksAssigned: number;
  tasksCompleted: number;
  accuracy: number;
  avgTimePerTask: string;
  issuesReported: number;
  lastActive: string;
  role: string;
}

// Activity log interface
export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  targetType: string;
  targetId: string;
  timestamp: string;
  details?: string;
}

// Workflow statistics interface
export interface WorkflowStats {
  date: string;
  tasksCreated: number;
  tasksCompleted: number;
  issuesReported: number;
}

// Get team member statistics for a project
export const getTeamMemberStatsByProjectId = async (projectId: string): Promise<TeamMemberStats[]> => {
  if (!pool || !(await isDatabaseAvailable())) {
    return [];
  }
  
  try {
    const convertUndefinedToNull = (value: unknown) => value === undefined ? null : value;
    
    // This query aggregates task and issue data per user to create team statistics
    const query = `
      SELECT 
        u.id,
        u.user_id as userId,
        u.name,
        u.email,
        u.avatar_url as avatarUrl,
        COUNT(t.id) as tasksAssigned,
        SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) as tasksCompleted,
        COALESCE(AVG(CASE WHEN t.status = 'completed' THEN CAST(REPLACE(REPLACE(t.actual_time, ' min', ''), ' hr', '') AS DECIMAL(10,2)) END), 0) as avgTimePerTask,
        COUNT(i.id) as issuesReported,
        COALESCE(MAX(t.updated_at), MAX(i.updated_at), u.created_at) as lastActive,
        COALESCE(pr.role, 'member') as role
      FROM users u
      LEFT JOIN tasks t ON u.id = t.assignee_id AND t.project_id = ?
      LEFT JOIN issues i ON u.id = i.reporter_id AND i.project_id = ?
      LEFT JOIN (
        SELECT owner as user_id, 'owner' as role, project_id FROM project_rbac WHERE project_id = ?
        UNION
        SELECT JSON_UNQUOTE(JSON_EXTRACT(admins, CONCAT('$[', num.n, ']'))) as user_id, 'admin' as role, project_id 
        FROM project_rbac, (SELECT 0 as n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) num
        WHERE project_id = ? AND JSON_EXTRACT(admins, CONCAT('$[', num.n, ']')) IS NOT NULL
        UNION
        SELECT JSON_UNQUOTE(JSON_EXTRACT(managers, CONCAT('$[', num.n, ']'))) as user_id, 'manager' as role, project_id 
        FROM project_rbac, (SELECT 0 as n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) num
        WHERE project_id = ? AND JSON_EXTRACT(managers, CONCAT('$[', num.n, ']')) IS NOT NULL
      ) pr ON u.id = pr.user_id
      WHERE u.id IN (
        SELECT DISTINCT assignee_id FROM tasks WHERE project_id = ? AND assignee_id IS NOT NULL
        UNION
        SELECT DISTINCT reporter_id FROM issues WHERE project_id = ? AND reporter_id IS NOT NULL
      )
      GROUP BY u.id, u.user_id, u.name, u.email, u.avatar_url, pr.role
      ORDER BY tasksAssigned DESC, tasksCompleted DESC
    `;
    
    const params = Array(7).fill(convertUndefinedToNull(projectId));
    const [rows] = await pool.execute(query, params);
    return rows as TeamMemberStats[];
  } catch (error) {
    console.error('Error fetching team member stats from database:', error);
    throw error;
  }
};

// Get activity logs for a project
export const getProjectActivityLogs = async (projectId: string, limit: number = 10): Promise<ActivityLog[]> => {
  if (!pool || !(await isDatabaseAvailable())) {
    return [];
  }
  
  try {
    const convertUndefinedToNull = (value: unknown) => value === undefined ? null : value;
    
    // This query combines task and issue activities to create a project activity log
    const query = `
      (SELECT 
        CONCAT('task-', t.id) as id,
        t.assignee_id as userId,
        u.name as userName,
        CONCAT('Completed task: ', t.title) as action,
        'task' as targetType,
        t.id as targetId,
        t.updated_at as timestamp,
        CONCAT('Task marked as ', t.status) as details
      FROM tasks t
      LEFT JOIN users u ON t.assignee_id = u.id
      WHERE t.project_id = ? AND t.status = 'completed'
      ORDER BY t.updated_at DESC
      LIMIT ?)
      UNION ALL
      (SELECT 
        CONCAT('issue-', i.id) as id,
        i.reporter_id as userId,
        u.name as userName,
        CONCAT('Reported issue: ', i.title) as action,
        'issue' as targetType,
        i.id as targetId,
        i.created_at as timestamp,
        CONCAT('Severity: ', i.severity) as details
      FROM issues i
      LEFT JOIN users u ON i.reporter_id = u.id
      WHERE i.project_id = ?
      ORDER BY i.created_at DESC
      LIMIT ?)
      ORDER BY timestamp DESC
      LIMIT ?
    `;
    
    const params = [
      convertUndefinedToNull(projectId),
      Math.ceil(limit / 2),
      convertUndefinedToNull(projectId),
      Math.ceil(limit / 2),
      limit
    ];
    
    const [rows] = await pool.execute(query, params);
    return rows as ActivityLog[];
  } catch (error) {
    console.error('Error fetching project activity logs from database:', error);
    throw error;
  }
};

// Get workflow statistics for a project
export const getProjectWorkflowStats = async (projectId: string, days: number = 30): Promise<WorkflowStats[]> => {
  if (!pool || !(await isDatabaseAvailable())) {
    return [];
  }
  
  try {
    const convertUndefinedToNull = (value: unknown) => value === undefined ? null : value;
    
    // This query gets daily workflow statistics for the past N days
    const query = `
      SELECT 
        DATE(created_at) as date,
        COUNT(CASE WHEN target_type = 'task' THEN 1 END) as tasksCreated,
        COUNT(CASE WHEN target_type = 'task' AND status = 'completed' THEN 1 END) as tasksCompleted,
        COUNT(CASE WHEN target_type = 'issue' THEN 1 END) as issuesReported
      FROM (
        SELECT 'task' as target_type, id, created_at, status, project_id FROM tasks WHERE project_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        UNION ALL
        SELECT 'issue' as target_type, id, created_at, NULL as status, project_id FROM issues WHERE project_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      ) combined
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;
    
    const params = [
      convertUndefinedToNull(projectId),
      days,
      convertUndefinedToNull(projectId),
      days
    ];
    
    const [rows] = await pool.execute(query, params);
    return rows as WorkflowStats[];
  } catch (error) {
    console.error('Error fetching project workflow stats from database:', error);
    throw error;
  }
};
