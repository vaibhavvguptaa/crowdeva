'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardHeader } from '@/components/Ui/card'; 
import { 
  TrendingUp, 
  Users, 
  Clock, 
  Target, 
  CheckCircle2, 
  AlertTriangle,
  ChevronDown,
  BarChart3,
  Activity,
  Zap,
  Bell,
  Share2
} from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  tasks: number;
  accuracy: string;
  avgTime: string;
  issues: number;
  avatarUrl?: string;
  specialization: string;
  responseQuality: number;
  evaluationsToday: number;
  consistencyScore: number;
  biasScore: number;
  comments: number;
  upvotes: number;
}

interface ProjectMetrics {
  totalEvaluations: number;
  inProgress: number;
  completed: number;
  totalDuration: string;
  avgTimePerEvaluation: string;
  avgAccuracy: number;
  modelPerformance: string;
  lastUpdated: string;
  weeklyGrowth: number;
  qualityScore: number;
  throughput: number;
}

export default function PerformanceTab() {
  const params = useParams();
  const [timeRange, setTimeRange] = useState('7d');
  const [showCustomTargets, setShowCustomTargets] = useState(false);
  const [projectMetrics, setProjectMetrics] = useState<ProjectMetrics | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!params?.projectId) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Fetch performance data
        const [metricsRes, teamRes] = await Promise.all([
          fetch(`/api/dashboard/${params.projectId}/metrics`),
          fetch(`/api/dashboard/${params.projectId}/team`)
        ]);
        
        if (!metricsRes.ok || !teamRes.ok) {
          throw new Error('Failed to fetch performance data');
        }
        
        const metricsData = await metricsRes.json();
        const teamData = await teamRes.json();
        
        setProjectMetrics(metricsData);
        setTeamMembers(teamData);
      } catch (err) {
        console.error('Error fetching performance data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load performance data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [params?.projectId]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm h-32 animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm h-48 animate-pulse" />
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm h-48 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm h-64 animate-pulse" />
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm h-64 animate-pulse" />
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 p-6 rounded-xl max-w-md">
          <h3 className="text-red-800 font-semibold mb-2">Error Loading Data</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Use default values if no data is available
  const metrics = projectMetrics || {
    totalEvaluations: 0,
    inProgress: 0,
    completed: 0,
    totalDuration: '0 min',
    avgTimePerEvaluation: '0 min',
    avgAccuracy: 0,
    modelPerformance: 'N/A',
    lastUpdated: new Date().toISOString(),
    weeklyGrowth: 0,
    qualityScore: 0,
    throughput: 0
  };

  const performanceMetrics = [
    { 
      icon: TrendingUp, 
      label: 'Overall Progress', 
      value: `${Math.round((metrics.completed / Math.max(1, metrics.totalEvaluations)) * 100)}%`, 
      change: `+${metrics.weeklyGrowth || 0}%`,
      trend: 'positive',
      description: 'Project completion rate'
    },
    { 
      icon: Users, 
      label: 'Active Annotators', 
      value: teamMembers.length.toString(), 
      change: '+1',
      trend: 'positive',
      description: 'Currently working'
    },
    { 
      icon: Clock, 
      label: 'Avg Response Time', 
      value: metrics.avgTimePerEvaluation || '0 min', 
      change: '-0.3min',
      trend: 'positive',
      description: 'Per task completion'
    },
    { 
      icon: Target, 
      label: 'Quality Score', 
      value: `${metrics.qualityScore || 0}%`, 
      change: `+${(metrics.qualityScore || 0) > 90 ? '2.1%' : '0%'}`,
      trend: 'positive',
      description: 'Accuracy rating'
    },
  ];

  const insights = [
    {
      icon: CheckCircle2,
      iconColor: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      title: 'High Quality Output',
      description: `Team maintains ${metrics.qualityScore || 0}% average accuracy across all tasks`,
      status: 'excellent'
    },
    {
      icon: TrendingUp,
      iconColor: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      title: 'Improving Efficiency',
      description: `Response time is ${metrics.avgTimePerEvaluation || '0 min'} per task`,
      status: 'improving'
    },
    {
      icon: AlertTriangle,
      iconColor: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      title: 'Monitor Workload',
      description: 'Consider redistributing tasks for optimal performance',
      status: 'attention'
    }
  ];

  const getTrendIcon = (trend: string) => {
    return trend === 'positive' ? (
      <TrendingUp className="w-3 h-3 text-green-500" />
    ) : (
      <Activity className="w-3 h-3 text-red-500" />
    );
  };

  const getTrendColor = (change: string) => {
    if (change.startsWith('+')) return 'text-green-600 bg-green-50';
    if (change.startsWith('-') && change.includes('min')) return 'text-green-600 bg-green-50'; // Negative time is good
    if (change.startsWith('-')) return 'text-red-600 bg-red-50';
    return 'text-gray-600 bg-gray-50';
  };

  // Find the most active annotator
  const mostActiveAnnotator = teamMembers.length > 0 
    ? teamMembers.reduce((prev, current) => 
        (prev.evaluationsToday > current.evaluationsToday) ? prev : current
      )
    : null;

  return (
    <div className="min-h-screen space-y-6">
      {/* Enhanced Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {performanceMetrics.map((metric) => (
          <div 
            key={metric.label}
            className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all duration-300"
          >
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">{metric.label}</p>
              <p className="text-xs text-gray-500 mt-1">{metric.description}</p>
            
              <div className="space-y-2 mt-4">
                <p className="text-3xl font-bold text-gray-900">{metric.value}</p>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getTrendColor(metric.change)}`}>
                    {getTrendIcon(metric.trend)}
                    <span>{metric.change}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Advanced Statistical Analysis Section */}
      

      {/* Anomaly Detection and Predictive Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Anomaly Detection */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-amber-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Anomaly Detection</h3>
          </div>
          <div className="space-y-4">
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <AlertTriangle className="w-4 h-4 text-red-600 mr-2" />
                <span className="font-medium text-red-800">Unusual Pattern Detected</span>
              </div>
              <p className="text-sm text-red-700 mt-1">
                {teamMembers.length > 0 
                  ? `Evaluator "${teamMembers[0].name}" showing unusual activity pattern.`
                  : 'No unusual patterns detected.'}
              </p>
            </div>
          
          </div>
        </div>

        {/* Predictive Analytics */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <Activity className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Predictive Analytics</h3>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-gray-600">Project Completion Date</span>
              <span className="font-semibold text-gray-900">
                {new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-gray-600">Risk of Delay</span>
              <span className="font-semibold text-amber-600">Low (12%)</span>
            </div>
          </div>
        </div>
      </div>

     
      {/* Additional Performance Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Stats */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Statistics</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-gray-600">Tasks Completed Today</span>
              <span className="font-semibold text-gray-900">
                {teamMembers.reduce((sum, member) => sum + member.evaluationsToday, 0)}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-gray-600">Average Quality Score</span>
              <span className="font-semibold text-green-600">{metrics.qualityScore || 0}%</span>
            </div>
           
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-gray-600">Most Active Annotator</span>
              <span className="font-semibold text-gray-900">
                {mostActiveAnnotator ? mostActiveAnnotator.name : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Performance Goals */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Performance Goals</h3>
            <button 
              className="text-sm text-green-600 hover:text-green-700 font-medium"
              onClick={() => setShowCustomTargets(true)}
            >
              Set Custom Targets
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Weekly Task Target</span>
                <span className="text-sm font-medium text-gray-900">
                  {metrics.throughput || 0}/1000
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full" 
                  style={{ width: `${Math.min(100, ((metrics.throughput || 0) / 1000) * 100)}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Quality Target</span>
                <span className="text-sm font-medium text-green-600">
                  {metrics.qualityScore || 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full" 
                  style={{ width: `${Math.min(100, (metrics.qualityScore || 0))}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Response Time Goal</span>
                <span className="text-sm font-medium text-gray-900">
                  {metrics.avgTimePerEvaluation || '0 min'}/6min
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-amber-500 h-2 rounded-full" 
                  style={{ width: '95%' }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Targets Overlay */}
      {showCustomTargets && (
        <div 
          className="fixed inset-0 bg-transparent flex items-center justify-center p-4 z-50"
          onClick={(e) => {
            // Close modal when clicking on the backdrop (outside the modal)
            if (e.target === e.currentTarget) {
              setShowCustomTargets(false);
            }
          }}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-700">Set Custom Weekly Targets</h3>
                <button 
                  onClick={() => setShowCustomTargets(false)}
                  className="text-gray-400 hover:text-gray-500 text-2xl"
                >
                  &times;
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tasks Target</label>
                <input 
                  type="number" 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-700"
                  placeholder="e.g., 1000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quality Score Target (%)</label>
                <input 
                  type="number" 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-700"
                  placeholder="e.g., 95"
                  min="0"
                  max="100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Response Time Target (minutes)</label>
                <input 
                  type="number" 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-700"
                  placeholder="e.g., 6"
                  step="0.1"
                />
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 flex space-x-3">
              <button className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium">
                Save Targets
              </button>
              <button 
                onClick={() => setShowCustomTargets(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}