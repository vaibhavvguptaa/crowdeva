"use client";
import React, { useState, useEffect } from "react";
import dynamic from 'next/dynamic';
import { Avatar } from "@/components/Ui/Avatar";
import Link from "next/link";
import { ErrorBoundary } from "react-error-boundary";
import { useParams } from "next/navigation";

// Dynamically import chart components for better bundle splitting
const IssueTrackerChart = dynamic(() => import('@/components/dashboard/charts/issueTrackerChart'), {
  ssr: false,
  loading: () => <div className="h-64 animate-pulse bg-gray-100 rounded-lg" />
});

const WorkflowActivityChart = dynamic(() => import('@/components/dashboard/charts/workflowActivityChart'), {
  ssr: false,
  loading: () => <div className="h-64 animate-pulse bg-gray-100 rounded-lg" />
});

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

function ErrorFallback({
  error,
  resetErrorBoundary,
}: {
  error: Error;
  resetErrorBoundary: () => void;
}) {
  return (
    <div className="p-6 bg-red-50 rounded-xl">
      <h3 className="text-red-800 font-semibold">Something went wrong:</h3>
      <pre className="text-red-600 text-sm mt-2">{error.message}</pre>
      <button
        onClick={resetErrorBoundary}
        className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
      >
        Try again
      </button>
    </div>
  );
}

export default function OverviewTab() {
  const params = useParams();
  const [timeRange, setTimeRange] = useState("7d");
  const [activeMetric, setActiveMetric] = useState("accuracy");
  const [projectMetrics, setProjectMetrics] = useState<ProjectMetrics | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [workflowData, setWorkflowData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!params?.projectId) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Use the combined endpoint for better performance
        const response = await fetch(`/api/dashboard/${params.projectId}/combined`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data');
        }
        
        const data = await response.json();
        
        setProjectMetrics(data.metrics);
        setTeamMembers(data.team);
        
        // Transform workflow data for the chart
        const transformedWorkflowData = data.workflow.week.map((item: any) => ({
          label: item.date,
          value: item.total,
          completed: item.completed,
          inProgress: item.inProgress
        }));
        
        setWorkflowData(transformedWorkflowData);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [params?.projectId]);

  if (loading) {
    return (
      <div className="min-h-screen space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm h-32 animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden flex flex-col lg:col-span-2 h-80 animate-pulse" />
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden flex flex-col lg:col-span-3 h-80 animate-pulse" />
        </div>
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden h-96 animate-pulse" />
      </div>
    );
  }

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

  if (!projectMetrics) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">No project data available</p>
        </div>
      </div>
    );
  }

  const progressPercentage = Math.round(
    (projectMetrics.completed / projectMetrics.totalEvaluations) * 100
  );

  const getSpecializationText = (specialization: string) => {
    return specialization;
  };

  const getTrendColor = (change: string) => {
    if (change.startsWith('+')) return 'text-green-600 bg-green-50';
    if (change.startsWith('-') && change.includes('min')) return 'text-green-600 bg-green-50';
    if (change.startsWith('-')) return 'text-gray-600 bg-gray-50';
    return 'text-gray-600 bg-gray-50';
  };

  // Define metrics with proper styling structure
  const keyMetrics = [
    {
      label: 'Total Evaluations',
      value: projectMetrics.totalEvaluations.toLocaleString(),
      change: undefined, 
      trend: 'positive',
      description: `${progressPercentage}% complete`,
      progress: undefined
    },
    {
      label: 'Quality Score',
      value: `${projectMetrics.qualityScore}%`,
      change: undefined, 
      trend: 'positive',
      description: `Avg accuracy: ${projectMetrics.avgAccuracy}%`,
      progress: undefined
    },
    {
      label: 'Daily Throughput',
      value: projectMetrics.throughput.toString(),
      change: undefined, 
      trend: 'positive',
      description: `Avg time: ${projectMetrics.avgTimePerEvaluation}`,
      progress: undefined
    }
    // Removed Active Evaluators metric
  ];

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <div className="min-h-screen space-y-6">

        {/* Enhanced Key Metrics Grid - Performance Tab Style */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {keyMetrics.map((metric) => (
            <div 
              key={metric.label}
              className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm flex flex-col"
            >
              <div className="flex-1">
                <p className="text-sm font-bold font-medium text-gray-600">{metric.label}</p>
                <p className="text-xs text-gray-500 mt-1">{metric.description}</p>
              </div>
              
              <div className="space-y-3 mt-4">
                <p className="text-3xl font-bold text-gray-900">{metric.value}</p>
                {/* Remove the change indicator */}
                {metric.change && (
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTrendColor(metric.change)}`}>
                      <span>{metric.change}</span>
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Charts Section - Simplified */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden flex flex-col lg:col-span-2">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Issue Analysis</h3>
              <p className="text-sm text-gray-600">Real-time issue tracking</p>
            </div>
            <div className="p-6 flex-grow">
              <IssueTrackerChart projectId={params?.projectId as string} />
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden flex flex-col lg:col-span-3">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Activity Overview</h3>
              <p className="text-sm text-gray-600">Weekly/ Monthly evaluation trends</p>
            </div>
            <div className="p-6 flex-grow">
              <WorkflowActivityChart projectId={params?.projectId as string} />
            </div>
          </div>
        </div>

        {/* Team Performance with Advanced Analytics */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Team Performance & Analytics</h3>
            <p className="text-sm text-gray-600">Evaluator metrics, consistency scores, and collaboration</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Evaluator
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Today
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Tasks
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Accuracy
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Consistency
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {teamMembers.map((member) => (
                  <tr
                    key={member.id}
                    className="hover:bg-gray-50 transition-colors duration-150"
                  >
                    <td className="px-6 py-4">
                      <Link
                        href={`/profile/${member.id}`}
                        className="flex items-center gap-3 group"
                      >
                        <Avatar className="w-10 h-10">
                          <div className="w-full h-full bg-green-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                            {member.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </div>
                        </Avatar>
                        <div>
                          <p className="font-medium text-gray-900 group-hover:text-green-600 transition-colors">
                            {member.name}
                          </p>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            {getSpecializationText(member.specialization)}
                          </div>
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">
                          {member.evaluationsToday}
                        </span>
                        <span className="text-xs text-gray-500">evals</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-900">
                        {member.tasks}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-900">
                        {member.accuracy}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-full bg-gray-200 rounded-full h-2 max-w-[60px]">
                          <div
                            className="h-2 bg-green-600 rounded-full transition-all duration-300"
                            style={{ width: `${member.consistencyScore || 0}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-gray-600">
                          {member.consistencyScore || 0}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
       
      </div>
    </ErrorBoundary>
  );
}