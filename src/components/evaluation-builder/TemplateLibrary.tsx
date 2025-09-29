'use client';

import React, { useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { FormTemplate, EvaluationFormConfig } from '@/types/evaluation-builder';

interface TemplateLibraryProps {
  onSelectTemplate: (template: EvaluationFormConfig) => void;
}

const TemplateLibrary: React.FC<TemplateLibraryProps> = ({ onSelectTemplate }) => {
  // Mock templates data
  const templates: FormTemplate[] = [
    {
      id: 'basic-comparison',
      name: 'Basic Comparison',
      description: 'Simple A/B response evaluation with side-by-side comparison and rating.',
      category: 'comparison',
      thumbnail: '/templates/basic-comparison.png',
      config: {
        form_version: "1.0",
        project_id: "",
        layout: {
          header: [
            {
              id: 'text_display_instructions',
              type: 'TEXT_DISPLAY',
              properties: {
                label: 'Instructions',
                content: 'Compare the two LLM responses below and select the best one. Rate each response on a scale of 1-10.',
                format: 'plain'
              }
            }
          ],
          body: [
            {
              id: 'response_comparison_1',
              type: 'RESPONSE_COMPARISON',
              properties: {
                label: 'Compare Responses',
                layout: 'side-by-side',
                show_scores: true,
                required: true
              }
            },
            {
              id: 'best_response_selector_1',
              type: 'BEST_RESPONSE_SELECTOR',
              properties: {
                label: 'Select the Better Response',
                options: ['Response A', 'Response B'],
                required: true
              }
            },
            {
              id: 'textarea_feedback',
              type: 'TEXTAREA',
              properties: {
                label: 'Provide Feedback',
                placeholder: 'Explain your reasoning...',
                required: false,
                rows: 3
              }
            },
            {
              id: 'submit_button_1',
              type: 'SUBMIT_BUTTON',
              properties: {
                label: '',
                text: 'Submit Evaluation'
              }
            }
          ]
        }
      }
    },
    {
      id: 'detailed-analysis',
      name: 'Detailed Analysis',
      description: 'Comprehensive scoring across multiple dimensions with detailed feedback options.',
      category: 'analysis',
      thumbnail: '/templates/detailed-analysis.png',
      config: {
        form_version: "1.0",
        project_id: "",
        layout: {
          header: [
            {
              id: 'text_display_instructions',
              type: 'TEXT_DISPLAY',
              properties: {
                label: 'Evaluation Guidelines',
                content: '# Detailed LLM Response Analysis\n\nEvaluate the response thoroughly on all dimensions. Provide specific examples for any issues identified.',
                format: 'plain'
              }
            }
          ],
          body: [
            {
              id: 'response_display',
              type: 'TEXT_DISPLAY',
              properties: {
                label: 'LLM Response',
                content: 'The LLM response will appear here.',
                format: 'plain'
              }
            },
            {
              id: 'scoring_scale_1',
              type: 'SCORING_SCALE',
              properties: {
                label: 'Quality Assessment',
                min: 1,
                max: 10,
                criteria: ['Accuracy', 'Clarity', 'Completeness', 'Relevance', 'Coherence'],
                required: true
              }
            },
            {
              id: 'issue_labeling_1',
              type: 'ISSUE_LABELING',
              properties: {
                label: 'Issues Identified',
                options: [
                  'Factual Error', 
                  'Hallucination', 
                  'Unclear Explanation', 
                  'Missing Context', 
                  'Contradictory Information',
                  'Biased Language',
                  'Incomplete Answer'
                ],
                allow_multiple: true,
                required: false
              }
            },
            {
              id: 'text_annotation_1',
              type: 'TEXT_ANNOTATION',
              properties: {
                label: 'Annotate Response',
                help_text: 'Highlight specific parts of the response that contain issues or are particularly good.'
              }
            },
            {
              id: 'textarea_strengths',
              type: 'TEXTAREA',
              properties: {
                label: 'Strengths',
                placeholder: 'What aspects of this response were particularly good?',
                required: false,
                rows: 2
              }
            },
            {
              id: 'textarea_weaknesses',
              type: 'TEXTAREA',
              properties: {
                label: 'Weaknesses',
                placeholder: 'What aspects of this response could be improved?',
                required: false,
                rows: 2
              }
            },
            {
              id: 'submit_button_1',
              type: 'SUBMIT_BUTTON',
              properties: {
                text: 'Submit Detailed Analysis'
              }
            }
          ]
        }
      }
    },
    {
      id: 'issue-detection',
      name: 'Issue Detection',
      description: 'Focus on identifying and categorizing problems in LLM responses.',
      category: 'quality',
      thumbnail: '/templates/issue-detection.png',
      config: {
        form_version: "1.0",
        project_id: "",
        layout: {
          header: [
            {
              id: 'text_display_instructions',
              type: 'TEXT_DISPLAY',
              properties: {
                label: 'Issue Detection Guidelines',
                content: 'Review the LLM response carefully and identify any issues or problems. Categorize each issue and provide specific examples.',
                format: 'plain'
              }
            }
          ],
          body: [
            {
              id: 'response_display',
              type: 'TEXT_DISPLAY',
              properties: {
                label: 'LLM Response',
                content: 'The LLM response will appear here.',
                format: 'plain'
              }
            },
            {
              id: 'issue_labeling_1',
              type: 'ISSUE_LABELING',
              properties: {
                label: 'Categorize Issues',
                options: [
                  'Factual Error', 
                  'Hallucination', 
                  'Inconsistency', 
                  'Bias',
                  'Safety Concern',
                  'Incomplete Information',
                  'Irrelevant Content'
                ],
                allow_multiple: true,
                allow_custom: true,
                required: true
              }
            },
            {
              id: 'text_annotation_1',
              type: 'TEXT_ANNOTATION',
              properties: {
                label: 'Highlight Problem Areas',
                help_text: 'Select text in the response and apply issue labels.',
                highlight_colors: ['#FFD700', '#FFA07A', '#98FB98', '#87CEEB'],
                categories: ['Factual Error', 'Hallucination', 'Inconsistency', 'Bias']
              }
            },
            {
              id: 'textarea_explanation',
              type: 'TEXTAREA',
              properties: {
                label: 'Explain Issues',
                placeholder: 'Provide detailed explanations for each identified issue...',
                required: true,
                rows: 4
              }
            },
            {
              id: 'submit_button_1',
              type: 'SUBMIT_BUTTON',
              properties: {
                text: 'Submit Issue Report'
              }
            }
          ]
        }
      }
    },
    {
      id: 'custom-evaluation',
      name: 'Custom Evaluation',
      description: 'Fully customizable evaluation form with flexible components.',
      category: 'custom',
      thumbnail: '/templates/custom-evaluation.png',
      config: {
        form_version: "1.0",
        project_id: "",
        layout: {
          header: [
            {
              id: 'text_display_instructions',
              type: 'TEXT_DISPLAY',
              properties: {
                label: 'Custom Evaluation Form',
                content: 'This is a customizable evaluation form. Add your own components and structure as needed.',
                format: 'plain'
              }
            }
          ],
          body: [
            {
              id: 'response_display',
              type: 'TEXT_DISPLAY',
              properties: {
                label: 'LLM Response',
                content: 'The LLM response will appear here.',
                format: 'plain'
              }
            },
            {
              id: 'evaluation_criteria_1',
              type: 'EVALUATION_CRITERIA',
              properties: {
                label: 'Evaluation Criteria',
                criteria: [
                  { id: 'criterion1', label: 'Accuracy', description: 'Is the information factually correct?' },
                  { id: 'criterion2', label: 'Completeness', description: 'Does the response address all aspects of the query?' },
                  { id: 'criterion3', label: 'Clarity', description: 'Is the response easy to understand?' }
                ]
              }
            },
            {
              id: 'dropdown_metric1',
              type: 'DROPDOWN',
              properties: {
                label: 'Custom Metric 1',
                options: ['Excellent', 'Good', 'Average', 'Poor', 'Very Poor'],
                required: true
              }
            },
            {
              id: 'dropdown_metric2',
              type: 'DROPDOWN',
              properties: {
                label: 'Custom Metric 2',
                options: ['Excellent', 'Good', 'Average', 'Poor', 'Very Poor'],
                required: true
              }
            },
            {
              id: 'textarea_custom_feedback',
              type: 'TEXTAREA',
              properties: {
                label: 'Custom Feedback',
                placeholder: 'Provide feedback based on your custom criteria...',
                required: true,
                rows: 4
              }
            },
            {
              id: 'submit_button_1',
              type: 'SUBMIT_BUTTON',
              properties: {
                text: 'Submit Custom Evaluation'
              }
            }
          ]
        }
      }
    }
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Template Library</h2>
        <p className="text-gray-600">Choose a template to get started quickly with your evaluation form</p>
      </div>

      {/* Templates Grid - without search and filters */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {templates.map(template => (
            <div 
              key={template.id}
              className="border border-gray-200 rounded-xl overflow-hidden hover:border-green-400 hover:shadow-md transition-all duration-200 cursor-pointer group"
              onClick={() => onSelectTemplate(template.config)}
            >
              <div className="bg-gray-100 h-40 flex items-center justify-center">
                <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16" />
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-green-700">{template.name}</h3>
                  <Check className="w-5 h-5 text-green-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-gray-600 text-sm mt-2 mb-4">{template.description}</p>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {template.category}
                  </span>
                  <span className="text-sm text-green-600 font-medium flex items-center">
                    Use Template
                    <ArrowRight className="ml-1 w-4 h-4" />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TemplateLibrary;