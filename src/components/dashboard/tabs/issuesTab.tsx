'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader } from '@/components/Ui/card';
import { 
  AlertTriangle, 
  AlertCircle, 
  Info,
  Search,
  Filter,
  Plus,
  Calendar,
  User as UserIcon,
  MessageCircle,
  ThumbsUp,
  Share2,
  Bell,
  ChevronDown
} from 'lucide-react';
import { Avatar } from '@/components/Ui/Avatar';
import { LoadingOverlay } from '@/components/Ui/LoadingOverlay';

// Define interfaces to match the API response
interface User {
  id: string;
  userId: string;
  name: string;
  email: string;
  createdAt: string;
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

export default function IssuesTab({ projectId }: { projectId?: string }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<'all' | IssueSeverity>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | IssueStatus>('all');
  const [sortBy, setSortBy] = useState<'updated' | 'created' | 'upvotes'>('updated');
  const [issues, setIssues] = useState<Issue[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch issues when projectId changes
  useEffect(() => {
    if (projectId) {
      setIsLoading(true);
      fetchIssues(projectId);
    }
  }, [projectId]);

  const fetchIssues = async (projectId: string) => {
    try {
      const response = await fetch(`/api/dashboard/${projectId}/issues`);
      if (!response.ok) {
        throw new Error(`Failed to fetch issues: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      setIssues(data);
    } catch (error) {
      console.error('Failed to fetch issues:', error);
      // Fallback to empty array if fetch fails
      setIssues([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getSeverityIcon = (severity: IssueSeverity) => {
    switch (severity) {
      case 'critical':
      case 'high': 
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'medium': 
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case 'low': 
        return <Info className="w-4 h-4 text-blue-600" />;
      default: 
        return <Info className="w-4 h-4 text-blue-600" />;
    }
  };

  const getSeverityColor = (severity: IssueSeverity) => {
    switch (severity) {
      case 'critical':
      case 'high': 
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': 
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': 
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default: 
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getStatusColor = (status: IssueStatus) => {
    switch (status) {
      case 'open': 
        return 'bg-red-100 text-red-800';
      case 'in-progress': 
        return 'bg-blue-100 text-blue-800';
      case 'resolved': 
        return 'bg-green-100 text-green-800';
      case 'closed': 
        return 'bg-gray-100 text-gray-800';
      default: 
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredIssues = issues.filter(issue => {
    const matchesSearch = issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         issue.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = severityFilter === 'all' || issue.severity === severityFilter;
    const matchesStatus = statusFilter === 'all' || issue.status === statusFilter;
    
    return matchesSearch && matchesSeverity && matchesStatus;
  });

  // Sort issues
  const sortedIssues = [...filteredIssues].sort((a, b) => {
    if (sortBy === 'updated') {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    } else if (sortBy === 'created') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else if (sortBy === 'upvotes') {
      return b.upvotes - a.upvotes;
    }
    return 0;
  });

  const issueStats = {
    total: issues.length,
    open: issues.filter(i => i.status === 'open').length,
    inProgress: issues.filter(i => i.status === 'in-progress').length,
    resolved: issues.filter(i => i.status === 'resolved').length,
    closed: issues.filter(i => i.status === 'closed').length,
    critical: issues.filter(i => i.severity === 'critical').length,
    high: issues.filter(i => i.severity === 'high').length,
    medium: issues.filter(i => i.severity === 'medium').length,
    low: issues.filter(i => i.severity === 'low').length
  };

  if (isLoading) return <LoadingOverlay />;

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-8 gap-4">
        <Card>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{issueStats.total}</p>
            <p className="text-sm text-black">Total Issues</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">{issueStats.open}</p>
            <p className="text-sm text-gray-500">Open</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{issueStats.inProgress}</p>
            <p className="text-sm text-gray-500">In Progress</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{issueStats.resolved}</p>
            <p className="text-sm text-gray-500">Resolved</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-600">{issueStats.closed}</p>
            <p className="text-sm text-gray-500">Closed</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">{issueStats.critical + issueStats.high}</p>
            <p className="text-sm text-gray-500">High Priority</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-600">{issueStats.medium}</p>
            <p className="text-sm text-gray-500">Medium</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{issueStats.low}</p>
            <p className="text-sm text-gray-500">Low</p>
          </div>
        </Card>
      </div>

      {/* Enhanced Filters */}
      <Card>
        <div className="flex flex-wrap gap-4 items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-800" />
            <input
              type="text"
              placeholder="Search issues..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-800"
            />
          </div>

          {/* Severity Filter */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value as 'all' | IssueSeverity)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-800"
          >
            <option value="all">All Severity</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | IssueStatus)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-800"
          >
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="in-progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>

          {/* Share and Export */}
          <div className="flex space-x-2 ml-auto">
            <button className="flex items-center px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Share2 className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>
      </Card>

      {/* Enhanced Issues List with Collaboration Features */}
      <div className="space-y-4">
        {sortedIssues.map((issue) => (
          <Card key={issue.id} className="hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  {getSeverityIcon(issue.severity)}
                  <h3 className="text-lg font-medium text-gray-900">{issue.title}</h3>
                  <span className="text-sm text-gray-500">#{issue.id}</span>
                  <span className={`px-2 py-1 text-xs rounded border ${getSeverityColor(issue.severity)}`}>
                    {issue.severity}
                  </span>
                  <span className={`px-2 py-1 text-xs rounded ${getStatusColor(issue.status)}`}>
                    {issue.status}
                  </span>
                </div>
                
                <p className="text-gray-600 mb-3">{issue.description}</p>
                
                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {issue.tags.map((tag, index) => (
                    <span key={index} className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                      {tag}
                    </span>
                  ))}
                </div>
                
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <UserIcon className="w-4 h-4" />
                    <span>Reporter: {issue.reporter.name}</span>
                  </div>
                  {issue.assignee && (
                    <div className="flex items-center space-x-1">
                      <Avatar
                        src={issue.assignee.avatarUrl}
                        alt={issue.assignee.name}
                        fallback={issue.assignee.name.split(' ').map(n => n[0]).join('')}
                        className="w-6 h-6"
                      />
                      <span>Assignee: {issue.assignee.name}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>Created: {new Date(issue.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MessageCircle className="w-4 h-4" />
                    <span>{issue.comments} comments</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <ThumbsUp className="w-4 h-4" />
                    <span>{issue.upvotes} upvotes</span>
                  </div>
                </div>

                <div className="mt-2 flex items-center gap-2">
                  <span className="px-2 py-1 text-xs bg-gray-800 text-white rounded">
                    {issue.category}
                  </span>
                  <span className="text-xs text-gray-900">
                    Affects {issue.affectedTasks} tasks
                  </span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {sortedIssues.length === 0 && !isLoading && (
        <Card>
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No issues found matching your criteria.</p>
          </div>
        </Card>
      )}
    </div>
  );
}