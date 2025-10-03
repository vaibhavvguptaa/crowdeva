"use client"

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Eye, Layout } from 'lucide-react';
import BuilderCanvas from '@/components/evaluation-builder/BuilderCanvas';
import TemplateLibrary from '@/components/evaluation-builder/TemplateLibrary';
import { projectService } from '@/services/projectService';
import { EvaluationFormConfig } from '@/types';
import { FullScreenLoading } from '@/components/Ui/LoadingOverlay';
import { ErrorBoundary } from '@/components/Ui/ErrorBoundary';

const initialFormConfig: EvaluationFormConfig = {
  form_version: "1.0",
  project_id: "",
  layout: {
    header: [],
    body: []
  }
};

export default function EvaluationPage({ params }: { params: Promise<{ projectId: string }> }) {
  // Unwrap the params promise
  const unwrappedParams = React.use(params);
  const [formConfig, setFormConfig] = useState<EvaluationFormConfig>({
    ...initialFormConfig,
    project_id: unwrappedParams.projectId
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTemplateLibrary, setShowTemplateLibrary] = useState(false);
  const router = useRouter();

  // Load existing evaluation structure
  useEffect(() => {
    const loadEvaluationStructure = async () => {
      try {
        setIsLoading(true);
        const structure = await projectService.getEvaluationStructure(unwrappedParams.projectId);
        if (structure) {
          setFormConfig({
            ...structure,
            project_id: unwrappedParams.projectId
          });
        } else {
          setError('No evaluation structure found for this project');
        }
      } catch (error) {
        console.error('Error loading evaluation structure:', error);
        setError('Failed to load evaluation structure');
      } finally {
        setIsLoading(false);
      }
    };

    loadEvaluationStructure();
  }, [unwrappedParams.projectId]);

  const handleSelectTemplate = (template: EvaluationFormConfig) => {
    setFormConfig({
      ...template,
      project_id: unwrappedParams.projectId
    });
    setShowTemplateLibrary(false);
  };

  if (isLoading) {
    return <FullScreenLoading message="Loading evaluation..." />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Eye className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Evaluation</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/projects')}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Back to Projects
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="flex flex-col h-screen bg-white">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/projects')}
                className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-xl font-semibold text-gray-900">Evaluation</h1>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowTemplateLibrary(true)}
                className="flex items-center space-x-2 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              >
                <Layout className="w-4 h-4" />
                <span>Templates</span>
              </button>
              <div className="text-sm text-gray-500">
                Project ID: {unwrappedParams.projectId}
              </div>
            </div>
          </div>
        </header>

        {/* Evaluation Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-4xl mx-auto">
            <BuilderCanvas
              formConfig={formConfig}
              selectedComponentId={undefined}
              onSelectComponent={() => {}}
              onRemoveComponent={() => {}}
              setCanvasSection={() => {}}
              previewMode={true}
              // Disable add component functionality in preview mode
            />
          </div>
        </div>

        {/* Template Library Modal */}
        {showTemplateLibrary && (
          <div 
            className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowTemplateLibrary(false)}
          >
            <div 
              className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Template Library</h2>
                <button
                  onClick={() => setShowTemplateLibrary(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Eye className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-auto p-6">
                <TemplateLibrary onSelectTemplate={handleSelectTemplate} />
              </div>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}