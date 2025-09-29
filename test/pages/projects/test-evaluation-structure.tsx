// Test component to verify evaluation structure functionality
'use client';

import React, { useState, useEffect } from 'react';
import { projectService } from '@/services/projectService';
import { EvaluationFormConfig } from '@/types';

const TestEvaluationStructure: React.FC = () => {
  const [testResult, setTestResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const runTest = async () => {
    setIsLoading(true);
    try {
      // Create a test project
      const testProject = await projectService.createProject({
        name: 'Test Project for Evaluation Structure',
        description: 'A test project to verify evaluation structure functionality',
        type: 'General',
        status: 'active',
      });

      // Create a test evaluation structure
      const testStructure: EvaluationFormConfig = {
        form_version: "1.0",
        project_id: testProject.id,
        layout: {
          header: [
            {
              id: 'header_text_1',
              type: 'TEXT_DISPLAY',
              properties: {
                label: 'Test Header',
                content: 'This is a test header component'
              }
            }
          ],
          body: [
            {
              id: 'text_input_1',
              type: 'TEXT_INPUT',
              properties: {
                label: 'Test Input',
                required: true
              }
            },
            {
              id: 'submit_button_1',
              type: 'SUBMIT_BUTTON',
              properties: {
                text: 'Submit Test'
              }
            }
          ]
        }
      };

      // Save the evaluation structure
      const saveResult = await projectService.saveEvaluationStructure(testProject.id, testStructure);
      
      // Retrieve the evaluation structure
      const retrievedStructure = await projectService.getEvaluationStructure(testProject.id);
      
      // Verify the structure was saved and retrieved correctly
      if (saveResult && retrievedStructure) {
        setTestResult(`SUCCESS: Evaluation structure saved and retrieved correctly for project ${testProject.id}`);
      } else {
        setTestResult(`ERROR: Failed to save or retrieve evaluation structure`);
      }
    } catch (error) {
      setTestResult(`ERROR: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Evaluation Structure Test</h2>
      <button
        onClick={runTest}
        disabled={isLoading}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {isLoading ? 'Running Test...' : 'Run Test'}
      </button>
      {testResult && (
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <p className="font-mono">{testResult}</p>
        </div>
      )}
    </div>
  );
};

export default TestEvaluationStructure;