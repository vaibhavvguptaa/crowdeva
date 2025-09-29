'use client';

import React, { useState, useEffect } from 'react';
import { X, Info } from 'lucide-react';
import { FormComponent, ComponentType, LoomVideoProperties } from '@/types';

interface PropertiesPanelProps {
  component: FormComponent;
  onUpdateComponent: (properties: any) => void;
  onClose: () => void;
}

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ component, onUpdateComponent, onClose }) => {
  const [activeTab, setActiveTab] = useState<'content' | 'style' | 'advanced'>('content');
  
  // Common properties that are available for all component types
  const renderCommonProperties = () => (
    <div className="space-y-5">
      {/* Label */}
      <div>
        <label className="block text-sm font-medium text-gray-800 mb-2">
          Label
        </label>
        <input
          type="text"
          value={component.properties.label || ''}
          onChange={(e) => onUpdateComponent({ label: e.target.value })}
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-700 shadow-sm"
          placeholder="Component label"
        />
      </div>
      
      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-800 mb-2">
          Description
        </label>
        <textarea
          value={component.properties.description || ''}
          onChange={(e) => onUpdateComponent({ description: e.target.value })}
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-700 shadow-sm"
          placeholder="Optional description"
          rows={2}
        />
      </div>
      
      {/* Help Text */}
      <div>
        <label className="block text-sm font-medium text-gray-800 mb-2">
          Help Text
        </label>
        <input
          type="text"
          value={component.properties.help_text || ''}
          onChange={(e) => onUpdateComponent({ help_text: e.target.value })}
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-700 shadow-sm"
          placeholder="Optional help text"
        />
      </div>
      
      {/* Required */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="required"
            checked={component.properties.required || false}
            onChange={(e) => onUpdateComponent({ required: e.target.checked })}
            className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
          />
          <label htmlFor="required" className="ml-2 block text-sm font-medium text-gray-800">
            Required field
          </label>
        </div>
        <Info className="w-4 h-4 text-gray-400" />
      </div>
    </div>
  );

  // Render properties specific to the component type
  const renderTypeSpecificProperties = () => {
    switch (component.type) {
      case 'RESPONSE_COMPARISON':
        return (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-2">
                Layout
              </label>
              <select
                value={component.properties.layout || 'side-by-side'}
                onChange={(e) => onUpdateComponent({ layout: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-700 shadow-sm"
              >
                <option value="side-by-side">Side by Side</option>
                <option value="stacked">Stacked</option>
                <option value="tabbed">Tabbed</option>
              </select>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="show_scores"
                  checked={component.properties.show_scores || false}
                  onChange={(e) => onUpdateComponent({ show_scores: e.target.checked })}
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <label htmlFor="show_scores" className="ml-2 block text-sm font-medium text-gray-800">
                  Show scores
                </label>
              </div>
              <Info className="w-4 h-4 text-gray-400" />
            </div>
          </div>
        );
      
      case 'BEST_RESPONSE_SELECTOR':
      case 'ISSUE_LABELING':
      case 'CHECKBOX_GROUP':
      case 'RADIO_GROUP':
      case 'DROPDOWN':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-2">
              Options
            </label>
            <div className="space-y-3">
              {(component.properties.options || []).map((option: string, index: number) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...(component.properties.options || [])];
                      newOptions[index] = e.target.value;
                      onUpdateComponent({ options: newOptions });
                    }}
                    className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-700 shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const newOptions = [...(component.properties.options || [])];
                      newOptions.splice(index, 1);
                      onUpdateComponent({ options: newOptions });
                    }}
                    className="p-2.5 text-red-500 hover:text-red-700 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  const newOptions = [...(component.properties.options || []), `Option ${(component.properties.options || []).length + 1}`];
                  onUpdateComponent({ options: newOptions });
                }}
                className="w-full py-2.5 text-sm text-green-600 hover:text-green-700 font-medium rounded-lg border border-green-200 hover:border-green-300 hover:bg-green-50 transition-colors"
              >
                + Add Option
              </button>
            </div>
          </div>
        );
      
      case 'SCORING_SCALE':
        return (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">
                  Min Value
                </label>
                <input
                  type="number"
                  value={component.properties.min || 1}
                  onChange={(e) => onUpdateComponent({ min: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-700 shadow-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">
                  Max Value
                </label>
                <input
                  type="number"
                  value={component.properties.max || 10}
                  onChange={(e) => onUpdateComponent({ max: parseInt(e.target.value) || 10 })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-700 shadow-sm"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-2">
                Criteria
              </label>
              <div className="space-y-3">
                {(component.properties.criteria || []).map((criterion, index) => {
                  const criterionObj = typeof criterion === 'string' 
                    ? { id: `criterion${index}`, label: criterion, description: '' } 
                    : criterion;
                  
                  return (
                    <div key={index} className="space-y-2 p-3 border border-gray-200 rounded-lg">
                      <input
                        type="text"
                        value={criterionObj.label}
                        onChange={(e) => {
                          const newCriteria = [...(component.properties.criteria || [])];
                          const updatedCriterion = typeof newCriteria[index] === 'string'
                            ? { id: `criterion${index}`, label: e.target.value, description: '' }
                            : { ...newCriteria[index], label: e.target.value };
                          newCriteria[index] = updatedCriterion;
                          onUpdateComponent({ criteria: newCriteria });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-700"
                        placeholder="Criterion label"
                      />
                      <textarea
                        value={criterionObj.description || ''}
                        onChange={(e) => {
                          const newCriteria = [...(component.properties.criteria || [])];
                          const updatedCriterion = typeof newCriteria[index] === 'string'
                            ? { id: `criterion${index}`, label: newCriteria[index] as string, description: e.target.value }
                            : { ...newCriteria[index], description: e.target.value };
                          newCriteria[index] = updatedCriterion;
                          onUpdateComponent({ criteria: newCriteria });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-700"
                        placeholder="Criterion description (optional)"
                        rows={2}
                      />
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            const newCriteria = [...(component.properties.criteria || [])];
                            newCriteria.splice(index, 1);
                            onUpdateComponent({ criteria: newCriteria });
                          }}
                          className="text-sm text-red-500 hover:text-red-700 font-medium"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                })}
                <button
                  type="button"
                  onClick={() => {
                    const newCriteria = [
                      ...(component.properties.criteria || []), 
                      { id: `criterion${(component.properties.criteria || []).length}`, label: `Criterion ${(component.properties.criteria || []).length + 1}`, description: '' }
                    ];
                    onUpdateComponent({ criteria: newCriteria });
                  }}
                  className="w-full py-2.5 text-sm text-green-600 hover:text-green-700 font-medium rounded-lg border border-green-200 hover:border-green-300 hover:bg-green-50 transition-colors"
                >
                  + Add Criterion
                </button>
              </div>
            </div>
          </div>
        );
      
      case 'TEXT_INPUT':
      case 'TEXTAREA':
      case 'NUMBER_INPUT':
        return (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-2">
                Placeholder
              </label>
              <input
                type="text"
                value={component.properties.placeholder || ''}
                onChange={(e) => onUpdateComponent({ placeholder: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-700 shadow-sm"
                placeholder="Enter placeholder text"
              />
            </div>
            
            {component.type === 'TEXTAREA' && (
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">
                  Rows
                </label>
                <input
                  type="number"
                  value={component.properties.rows || 3}
                  onChange={(e) => onUpdateComponent({ rows: parseInt(e.target.value) || 3 })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-700 shadow-sm"
                  min="1"
                  max="20"
                />
              </div>
            )}
            
            {component.type === 'NUMBER_INPUT' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">
                      Min Value
                    </label>
                    <input
                      type="number"
                      value={component.properties.min || ''}
                      onChange={(e) => onUpdateComponent({ min: e.target.value ? parseInt(e.target.value) : undefined })}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-700 shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">
                      Max Value
                    </label>
                    <input
                      type="number"
                      value={component.properties.max || ''}
                      onChange={(e) => onUpdateComponent({ max: e.target.value ? parseInt(e.target.value) : undefined })}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-700 shadow-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-2">
                    Step
                  </label>
                  <input
                    type="number"
                    value={component.properties.step || ''}
                    onChange={(e) => onUpdateComponent({ step: e.target.value ? parseFloat(e.target.value) : undefined })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-700 shadow-sm"
                    step="any"
                  />
                </div>
              </>
            )}
          </div>
        );
      
      case 'LOOM_VIDEO':
        return (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-2">
                Video URL
              </label>
              <input
                type="text"
                value={(component.properties as LoomVideoProperties).video_url || ''}
                onChange={(e) => onUpdateComponent({ video_url: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-700 shadow-sm"
                placeholder="https://www.loom.com/share/..."
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">
                  Width
                </label>
                <input
                  type="text"
                  value={(component.properties as LoomVideoProperties).width || '100%'}
                  onChange={(e) => onUpdateComponent({ width: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-700 shadow-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">
                  Height
                </label>
                <input
                  type="text"
                  value={(component.properties as LoomVideoProperties).height || '300px'}
                  onChange={(e) => onUpdateComponent({ height: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-700 shadow-sm"
                />
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="show_controls"
                  checked={(component.properties as LoomVideoProperties).show_controls || false}
                  onChange={(e) => onUpdateComponent({ show_controls: e.target.checked })}
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <label htmlFor="show_controls" className="ml-2 block text-sm font-medium text-gray-800">
                  Show controls
                </label>
              </div>
              <Info className="w-4 h-4 text-gray-400" />
            </div>
          </div>
        );
      
      case 'TEXT_DISPLAY':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-2">
              Content
            </label>
            <textarea
              value={component.properties.content || ''}
              onChange={(e) => onUpdateComponent({ content: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-700 shadow-sm"
              placeholder="Enter display text"
              rows={5}
            />
          </div>
        );

      case 'CODE_EDITOR':
        // Type cast to CodeEditorProperties
        const codeEditorProps = component.properties as any;
        return (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-2">
                Default Code
              </label>
              <textarea
                value={codeEditorProps.default_code || ''}
                onChange={(e) => onUpdateComponent({ default_code: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-700 shadow-sm font-mono text-sm"
                placeholder="Enter default code"
                rows={6}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">
                  Language
                </label>
                {codeEditorProps.language === 'custom' ? (
                  <input
                    type="text"
                    value={codeEditorProps.custom_language || ''}
                    onChange={(e) => onUpdateComponent({ custom_language: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-700 shadow-sm"
                    placeholder="Enter custom language"
                  />
                ) : (
                  <select
                    value={codeEditorProps.language || 'javascript'}
                    onChange={(e) => onUpdateComponent({ language: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-700 shadow-sm"
                  >
                    <option value="javascript">JavaScript</option>
                    <option value="typescript">TypeScript</option>
                    <option value="python">Python</option>
                    <option value="java">Java</option>
                    <option value="cpp">C++</option>
                    <option value="html">HTML</option>
                    <option value="css">CSS</option>
                    <option value="json">JSON</option>
                    <option value="custom">Custom Language</option>
                  </select>
                )}
                {codeEditorProps.language === 'custom' && (
                  <button
                    onClick={() => onUpdateComponent({ language: 'javascript', custom_language: '' })}
                    className="mt-2 text-sm text-green-600 hover:text-green-800"
                  >
                    ← Back to predefined languages
                  </button>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">
                  Theme
                </label>
                <select
                  value={codeEditorProps.theme || 'light'}
                  onChange={(e) => onUpdateComponent({ theme: e.target.value as 'light' | 'dark' })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-700 shadow-sm"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="line_numbers"
                  checked={codeEditorProps.line_numbers || false}
                  onChange={(e) => onUpdateComponent({ line_numbers: e.target.checked })}
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <label htmlFor="line_numbers" className="ml-2 block text-sm font-medium text-gray-800">
                  Show line numbers
                </label>
              </div>
              <Info className="w-4 h-4 text-gray-400" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-2">
                Minimum Height (px)
              </label>
              <input
                type="number"
                value={codeEditorProps.min_height || 200}
                onChange={(e) => onUpdateComponent({ min_height: parseInt(e.target.value) || 200 })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-700 shadow-sm"
                min="100"
              />
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-8">
            <Info className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No additional properties available for this component type.</p>
          </div>
        );
    }
  };

  // Render style properties
  const renderStyleProperties = () => (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-800 mb-2">
            Width
          </label>
          <input
            type="text"
            value={component.properties.width || ''}
            onChange={(e) => onUpdateComponent({ width: e.target.value })}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-700 shadow-sm"
            placeholder="e.g., 100%, 300px"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-800 mb-2">
            Height
          </label>
          <input
            type="text"
            value={component.properties.height || ''}
            onChange={(e) => onUpdateComponent({ height: e.target.value })}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-700 shadow-sm"
            placeholder="e.g., auto, 200px"
          />
        </div>
      </div>
    </div>
  );

  // Render advanced properties
  const renderAdvancedProperties = () => (
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-800 mb-2">
          Visible To
        </label>
        <div className="space-y-2">
          {(['client', 'vendor', 'developer', 'admin'] as const).map((role) => (
            <div key={role} className="flex items-center">
              <input
                type="checkbox"
                id={`visible-${role}`}
                checked={(component.properties.visible_to || []).includes(role)}
                onChange={(e) => {
                  const currentRoles = component.properties.visible_to || [];
                  const newRoles = e.target.checked
                    ? [...currentRoles, role]
                    : currentRoles.filter(r => r !== role);
                  onUpdateComponent({ visible_to: newRoles });
                }}
                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
              <label htmlFor={`visible-${role}`} className="ml-2 block text-sm text-gray-700 capitalize">
                {role}
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Properties</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-1 truncate">
          {component.properties.label || component.type.replace(/_/g, ' ')}
        </p>
      </div>
      
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px">
          <button
            onClick={() => setActiveTab('content')}
            className={`py-3 px-4 text-sm font-medium border-b-2 ${
              activeTab === 'content'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Content
          </button>
          <button
            onClick={() => setActiveTab('style')}
            className={`py-3 px-4 text-sm font-medium border-b-2 ${
              activeTab === 'style'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Style
          </button>
          <button
            onClick={() => setActiveTab('advanced')}
            className={`py-3 px-4 text-sm font-medium border-b-2 ${
              activeTab === 'advanced'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Advanced
          </button>
        </nav>
      </div>
      
      {/* Properties Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'content' && renderCommonProperties()}
        {activeTab === 'content' && renderTypeSpecificProperties()}
        {activeTab === 'style' && renderStyleProperties()}
        {activeTab === 'advanced' && renderAdvancedProperties()}
      </div>
      
      {/* Footer */}
      <div className="border-t border-gray-200 p-4 bg-gray-50">
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 shadow-sm"
          >
            Cancel
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 shadow-sm"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};

export default PropertiesPanel;