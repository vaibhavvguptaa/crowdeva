'use client';

import React, { useMemo, useState, useEffect } from 'react';
import {
  Search,
  Plus,
  CheckCircle2,
  PlayCircle,
  PauseCircle,
  MoreHorizontal,
  ChevronDown,
  Flag,
  BarChart3,
  Eye,
  Edit3,
  MessageCircle,
  ThumbsUp,
  Share2,
  Bell,
  Calendar
} from 'lucide-react';
import { Avatar } from '@/components/Ui/Avatar';
import { cn } from '@/lib/utils';
import { LoadingOverlay } from '@/components/Ui/LoadingOverlay';

type TaskStatus = 'completed' | 'in-progress' | 'pending';
type TaskPriority = 'high' | 'medium' | 'low';

interface User {
  id: string;
  userId: string;
  name: string;
  email: string;
  createdAt: Date;
  avatarUrl?: string;
}

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

const statusIcon = (status: TaskStatus) => {
  switch (status) {
    case 'completed':
      return <CheckCircle2 className="w-4 h-4 text-green-600" />;
    case 'in-progress':
      return <PlayCircle className="w-4 h-4 text-green-600" />;
    case 'pending':
      return <PauseCircle className="w-4 h-4 text-amber-600" />;
  }
};

const statusBadge = (status: TaskStatus) => {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'in-progress':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'pending':
      return 'bg-amber-100 text-amber-800 border-amber-200';
  }
};

const priorityBadge = (priority: TaskPriority) => {
  switch (priority) {
    case 'high':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'medium':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'low':
      return 'bg-green-100 text-green-800 border-green-200';
  }
};

function Select<T extends string>({
  value,
  onChange,
  children
}: {
  value: T;
  onChange: (v: T) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2.5 pr-10 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
      >
        {children}
      </select>
      <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-gray-500 pointer-events-none" />
    </div>
  );
}

function StatCard({
  title,
  value,
  icon
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-600">{title}</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        <div className="p-3 bg-green-100 rounded-xl">
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function TasksTab({ projectId }: { projectId?: string }) {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | TaskStatus>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | TaskPriority>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<'all' | string>('all');
  const [sortBy, setSortBy] = useState<'updated' | 'created' | 'upvotes'>('updated');
  const [currentPage, setCurrentPage] = useState(1);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const tasksPerPage = 10;

  // Fetch tasks when projectId changes
  useEffect(() => {
    if (projectId) {
      setIsLoading(true);
      fetchTasks(projectId);
    }
  }, [projectId]);

  const fetchTasks = async (projectId: string) => {
    try {
      const response = await fetch(`/api/dashboard/${projectId}/tasks`);
      if (!response.ok) {
        throw new Error(`Failed to fetch tasks: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      setTasks(data);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
      // Fallback to empty array if fetch fails
      setTasks([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch =
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
      const matchesAssignee = assigneeFilter === 'all' || task.assignee.id === assigneeFilter;

      return matchesSearch && matchesStatus && matchesPriority && matchesAssignee;
    });
  }, [tasks, searchTerm, statusFilter, priorityFilter, assigneeFilter]);

  const sortedTasks = useMemo(() => {
    return [...filteredTasks].sort((a, b) => {
      if (sortBy === 'updated') {
        return 0;
      } else if (sortBy === 'created') {
        return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
      } else if (sortBy === 'upvotes') {
        return b.upvotes - a.upvotes;
      }
      return 0;
    });
  }, [filteredTasks, sortBy]);

  const paginatedTasks = useMemo(() => {
    const startIndex = (currentPage - 1) * tasksPerPage;
    return sortedTasks.slice(startIndex, startIndex + tasksPerPage);
  }, [sortedTasks, currentPage, tasksPerPage]);

  const totalPages = Math.ceil(sortedTasks.length / tasksPerPage);

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === 'completed').length;
    const inProgress = tasks.filter((t) => t.status === 'in-progress').length;
    const pending = tasks.filter((t) => t.status === 'pending').length;
    return { total, completed, inProgress, pending };
  }, [tasks]);

  if (isLoading) return <LoadingOverlay />;

  return (
    <>
      <div className="min-h-screen space-y-6">
        {/* Enhanced Filters */}
        <div className="">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <Select value={statusFilter} onChange={(v) => setStatusFilter(v as 'all' | TaskStatus)}>
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="in-progress">In Progress</option>
                <option value="pending">Pending</option>
              </Select>

              <Select value={priorityFilter} onChange={(v) => setPriorityFilter(v as 'all' | TaskPriority)}>
                <option value="all">All Priority</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </Select>

              <Select value={assigneeFilter} onChange={(v) => setAssigneeFilter(v)}>
                <option value="all">All Assignees</option>
                {Array.from(new Set(tasks.map(task => task.assignee.id))).map(assigneeId => {
                  const assignee = tasks.find(t => t.assignee.id === assigneeId)?.assignee;
                  return (
                    <option key={assigneeId} value={assigneeId}>
                      {assignee?.name || `Assignee ${assigneeId}`}
                    </option>
                  );
                })}
              </Select>
            </div>

            <div className="flex items-center space-x-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search tasks..."
                  className="w-64 pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <button className="flex items-center px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <Share2 className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced Table with Collaboration Features */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
            <div className="grid grid-cols-12 gap-4 items-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
              <div className="col-span-4">Task</div>
              <div className="col-span-2">Assignee</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-1">Priority</div>
              <div className="col-span-1">Due Date</div>
              <div className="col-span-1">Engagement</div>
              <div className="col-span-1">Actions</div>
            </div>
          </div>

          <div className="divide-y divide-gray-200">
            {paginatedTasks.map((task) => (
              <div key={task.id} className="px-6 py-4 hover:bg-gray-50 transition-all">
                <div className="grid grid-cols-12 gap-4 items-center">
                  {/* Task */}
                  <div className="col-span-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-green-100 rounded-lg border border-green-200">
                        {statusIcon(task.status)}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">{task.title}</h3>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{task.description}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          {task.labels?.map((label) => (
                            <span key={label} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                              {label}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Assignee */}
                  <div className="col-span-2">
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={task.assignee.avatarUrl}
                        alt={task.assignee.name}
                        fallback={task.assignee.name.split(' ').map((n) => n[0]).join('')}
                        className="w-8 h-8"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{task.assignee.name}</p>
                        <p className="text-xs text-gray-500">{task.assignee.email}</p>
                      </div>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="col-span-2">
                    <span className={cn('inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border', statusBadge(task.status))}>
                      {statusIcon(task.status)}
                      <span className="ml-2 capitalize">{task.status.replace('-', ' ')}</span>
                    </span>
                  </div>

                  {/* Priority */}
                  <div className="col-span-1">
                    <span className={cn('inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border', priorityBadge(task.priority))}>
                      <Flag className="w-3 h-3 mr-1" />
                      {task.priority}
                    </span>
                  </div>

                  {/* Due Date */}
                  <div className="col-span-1">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-1" />
                      <span>{task.dueDate}</span>
                    </div>
                  </div>

                  {/* Engagement (Comments & Upvotes) */}
                  <div className="col-span-1">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <div className="flex items-center">
                        <MessageCircle className="w-4 h-4 mr-1" />
                        <span>{task.comments}</span>
                      </div>
                      <div className="flex items-center">
                        <ThumbsUp className="w-4 h-4 mr-1" />
                        <span>{task.upvotes}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="col-span-1">
                    <div className="flex items-center gap-2">
                      <button className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {sortedTasks.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <p className="text-gray-600 font-medium">No tasks found</p>
              <p className="text-sm text-gray-500 mt-1">Try adjusting your search or filter criteria</p>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Pagination */}
      <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
        <div className="flex items-center text-sm text-gray-600">
          Showing <span className="font-medium mx-1">{(currentPage - 1) * tasksPerPage + 1} to {Math.min(currentPage * tasksPerPage, sortedTasks.length)}</span> of <span className="font-medium mx-1">{sortedTasks.length}</span> entries
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all disabled:opacity-50"
          >
            Previous
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`px-3 py-2 text-sm rounded-lg transition-all ${
                currentPage === page
                  ? 'bg-green-600 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </>
  );
}