'use client';

import React, { useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Edit, Trash2, ArrowUpDown, Info, ChevronDown, ChevronUp, Video, GripVertical, Plus, Code } from 'lucide-react';
import { 
  EvaluationFormConfig, 
  FormComponent, 
  CanvasSection,
  LoomVideoProperties
} from '@/types';

// Import the new functional code editor
import FunctionalCodeEditor from './FunctionalCodeEditor';

// Type guard function to check if properties are CodeEditorProperties
const isCodeEditorProperties = (properties: any) => {
  return 'default_code' in properties || 'language' in properties;
};

// Component Types to Icon and Color Mapping
import { 
  Grid,
  Divide,
  PanelRight,
  FolderKanban,
  GitCompare,
  RadioTower,
  Tag,
  Star,
  Edit as EditIcon,
  CheckSquare,
  Type,
  AlignLeft,
  List,
  ToggleLeft,
  CheckCheck,
  Hash,
  Calendar,
  FileText as FileTextIcon,
  PenTool,
  Upload,
  FileJson,
  Send,
  Save,
  SkipForward,
  RotateCcw,
  Code as CodeIcon
} from 'lucide-react';

interface BuilderCanvasProps {
  formConfig: EvaluationFormConfig;
  selectedComponentId: string | undefined;
  onSelectComponent: (component: FormComponent | null) => void;
  onRemoveComponent: (componentId: string, section: CanvasSection) => void;
  setCanvasSection: (section: CanvasSection) => void;
  previewMode: boolean;
  onAddComponent?: (type: string, section: CanvasSection) => void;
}

interface DragItem {
  index: number;
  id: string;
  section: CanvasSection;
}

const componentIconMap: Record<string, React.ElementType> = {
  GRID_CONTAINER: Grid,
  SECTION_DIVIDER: Divide,
  TAB_CONTAINER: PanelRight,
  ACCORDION_PANEL: FolderKanban,
  RESPONSE_COMPARISON: GitCompare,
  BEST_RESPONSE_SELECTOR: RadioTower,
  ISSUE_LABELING: Tag,
  SCORING_SCALE: Star,
  TEXT_ANNOTATION: EditIcon,
  EVALUATION_CRITERIA: CheckSquare,
  TEXT_INPUT: Type,
  TEXTAREA: AlignLeft,
  DROPDOWN: List,
  RADIO_GROUP: ToggleLeft,
  CHECKBOX_GROUP: CheckCheck,
  NUMBER_INPUT: Hash,
  DATETIME_INPUT: Calendar,
  TEXT_DISPLAY: FileTextIcon,
  RICH_TEXT_EDITOR: PenTool,
  CODE_EDITOR: CodeIcon,  
  FILE_UPLOAD: Upload,
  JSON_VIEWER: FileJson,
  LOOM_VIDEO: Video,
  SUBMIT_BUTTON: Send,
  SAVE_DRAFT_BUTTON: Save,
  SKIP_BUTTON: SkipForward,
  RESET_BUTTON: RotateCcw
};

const BuilderComponent: React.FC<{
  component: FormComponent;
  index: number;
  section: CanvasSection;
  isSelected: boolean;
  onSelect: () => void;
  onRemove: () => void;
  previewMode: boolean;
  formConfig: EvaluationFormConfig;
}> = ({ component, index, section, isSelected, onSelect, onRemove, previewMode, formConfig }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: component.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 'auto',
    position: isDragging ? 'relative' : 'static',
    boxShadow: isDragging ? '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' : 'none',
  };

  const IconComponent = componentIconMap[component.type] || FileTextIcon;

  // Render the component based on its type (preview mode)
  const renderComponentPreview = () => {
    switch (component.type) {
      case 'RESPONSE_COMPARISON':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg border border-gray-200 bg-white shadow-sm">
                <div className="text-sm font-bold text-gray-800 mb-2">Response A</div>
                <p className="text-sm text-gray-600">This is a sample response from an LLM. It would contain the actual model output that evaluators need to review.</p>
              </div>
              <div className="p-4 rounded-lg border border-gray-200 bg-white shadow-sm">
                <div className="text-sm font-bold text-gray-800 mb-2">Response B</div>
                <p className="text-sm text-gray-600">This is another sample response from a different LLM. Evaluators would compare this with Response A.</p>
              </div>
            </div>
          </div>
        );
      
      case 'BEST_RESPONSE_SELECTOR':
        return (
          <div className="space-y-3">
            {(component.properties.options || ['Response A', 'Response B']).map((option: string, i: number) => (
              <label key={i} className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50">
                <input type="radio" name={`best-response-${component.id}`} className="w-4 h-4 text-green-600" />
                <span className={`text-sm ${option === "Response A" || option === "Response B" ? "font-medium text-gray-800" : "text-gray-700"}`}>{option}</span>
              </label>
            ))}
          </div>
        );
      
      case 'ISSUE_LABELING':
        return (
          <div className="space-y-3">
            {(component.properties.options || ['Minor Issue', 'Major Issue', 'Cannot Access', 'N/A']).map((option: string, i: number) => (
              <label key={i} className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50">
                <input 
                  type={component.properties.allow_multiple ? "checkbox" : "radio"} 
                  name={`issue-label-${component.id}`} 
                  className="w-4 h-4 text-green-600" 
                />
                <span className="text-sm text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        );
      
      case 'SCORING_SCALE':
        return (
          <div className="space-y-4">
            {(component.properties.criteria || ['Accuracy', 'Clarity', 'Relevance']).map((criterion, i) => {
              const criterionText = typeof criterion === 'string' ? criterion : criterion.label;
              return (
                <div key={i} className="space-y-2">
                  <div className="text-sm font-medium text-gray-800">{criterionText}</div>
                  <div className="flex items-center space-x-2">
                    {Array.from({ length: (component.properties.max || 10) - (component.properties.min || 1) + 1 }).map((_, idx) => (
                      <button 
                        key={idx} 
                        className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-green-50 hover:border-green-400 text-gray-700 font-medium"
                      >
                        {idx + (component.properties.min || 1)}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        );
      
      case 'TEXT_ANNOTATION':
        return (
          <div className="space-y-4">
            <div className="p-4 border border-gray-200 rounded-lg bg-white shadow-sm">
              <p className="text-sm text-gray-700">
                <span className="bg-yellow-100 px-1 py-0.5 rounded">This is a sample</span> text that demonstrates how <span className="bg-green-100 px-1 py-0.5 rounded">annotations would appear</span> in the evaluation interface.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button className="px-3 py-1.5 text-xs bg-yellow-100 hover:bg-yellow-200 rounded-full text-gray-800 transition-colors">Factual Error</button>
              <button className="px-3 py-1.5 text-xs bg-green-100 hover:bg-green-200 rounded-full text-gray-800 transition-colors">Grammar Issue</button>
              <button className="px-3 py-1.5 text-xs bg-blue-100 hover:bg-blue-200 rounded-full text-gray-800 transition-colors">Unclear</button>
              <button className="px-3 py-1.5 text-xs bg-purple-100 hover:bg-purple-200 rounded-full text-gray-800 transition-colors">Great Example</button>
            </div>
          </div>
        );
      
      case 'EVALUATION_CRITERIA':
        return (
          <div className="space-y-3">
            {(component.properties.criteria || [
              { id: 'criterion1', label: 'Accuracy', description: 'Is the information factually correct?' },
              { id: 'criterion2', label: 'Completeness', description: 'Does the response address all aspects of the query?' },
              { id: 'criterion3', label: 'Clarity', description: 'Is the response easy to understand?' }
            ]).map((criterion, i) => {
              const criterionObj = typeof criterion === 'string' 
                ? { id: `criterion${i}`, label: criterion, description: '' } 
                : criterion;
              
              return (
                <div key={criterionObj.id} className="p-4 rounded-lg border border-gray-200 bg-white shadow-sm">
                  <div className="font-medium text-gray-800">{criterionObj.label}</div>
                  {criterionObj.description && (
                    <div className="text-sm text-gray-600 mt-1">{criterionObj.description}</div>
                  )}
                </div>
              );
            })}
          </div>
        );
      
      case 'TEXT_INPUT':
        return (
          <input
            type="text"
            placeholder={component.properties.placeholder || "Enter text..."}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-700"
          />
        );
      
      case 'TEXTAREA':
        return (
          <textarea
            placeholder={component.properties.placeholder || "Enter text..."}
            rows={component.properties.rows || 3}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-700"
          />
        );
      
      case 'DROPDOWN':
        return (
          <select className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-700">
            {(component.properties.options || ['Select...']).map((option: string, i: number) => (
              <option key={i} value={option}>{option}</option>
            ))}
          </select>
        );
      
      case 'RADIO_GROUP':
        return (
          <div className="space-y-2">
            {(component.properties.options || ['Option 1', 'Option 2']).map((option: string, i: number) => (
              <label key={i} className="flex items-center space-x-3">
                <input type="radio" name={`radio-${component.id}`} className="w-4 h-4 text-green-600" />
                <span className="text-sm text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        );
      
      case 'CHECKBOX_GROUP':
        return (
          <div className="space-y-2">
            {(component.properties.options || ['Option 1', 'Option 2']).map((option: string, i: number) => (
              <label key={i} className="flex items-center space-x-3">
                <input type="checkbox" className="w-4 h-4 text-green-600 rounded" />
                <span className="text-sm text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        );
      
      case 'NUMBER_INPUT':
        return (
          <input
            type="number"
            placeholder={component.properties.placeholder || "Enter number..."}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-700"
          />
        );
      
      case 'DATETIME_INPUT':
        return (
          <input
            type="datetime-local"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-700"
          />
        );
      
      case 'SECTION_DIVIDER':
        return (
          <div className="border-t border-gray-300 my-4"></div>
        );
      
      case 'TEXT_DISPLAY':
        return (
          <div className="prose prose-sm max-w-none">
            <div className="text-gray-700">
              {component.properties.content || "This is a text display component. Add your content here."}
            </div>
          </div>
        );
      
      case 'LOOM_VIDEO':
        return (
          <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-xl w-full h-64 flex items-center justify-center">
            <div className="text-center">
              <Video className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">Loom Video Preview</p>
              <p className="text-gray-400 text-xs mt-1">Video would appear here</p>
            </div>
          </div>
        );
      
      case 'SUBMIT_BUTTON':
      case 'SAVE_DRAFT_BUTTON':
      case 'SKIP_BUTTON':
      case 'RESET_BUTTON':
        const buttonText = {
          'SUBMIT_BUTTON': component.properties.text || 'Submit',
          'SAVE_DRAFT_BUTTON': component.properties.text || 'Save Draft',
          'SKIP_BUTTON': component.properties.text || 'Skip / Next',
          'RESET_BUTTON': component.properties.text || 'Reset Form'
        }[component.type];
        
        const buttonColor = {
          'SUBMIT_BUTTON': 'bg-green-600 hover:bg-green-700 text-white',
          'SAVE_DRAFT_BUTTON': 'bg-blue-600 hover:bg-blue-700 text-white',
          'SKIP_BUTTON': 'bg-gray-600 hover:bg-gray-700 text-white',
          'RESET_BUTTON': 'bg-red-600 hover:bg-red-700 text-white'
        }[component.type];
        
        const handleButtonClick = () => {
          if (!previewMode) return;
          
          if (component.type === 'SUBMIT_BUTTON') {
            // In a real scenario, this would submit the form data
            const confirmed = window.confirm('Submit this evaluation form?');
            if (confirmed) {
              // Redirect to dashboard or some completion page
              window.location.href = `/projects/dashboard/${formConfig.project_id}`;
            }
          } else if (component.type === 'SAVE_DRAFT_BUTTON') {
            alert('Draft saved successfully!');
          } else if (component.type === 'SKIP_BUTTON') {
            alert('Skipping to next item...');
          } else if (component.type === 'RESET_BUTTON') {
            alert('Form has been reset!');
          }
        };
        
        return (
          <button
            onClick={handleButtonClick}
            className={`px-6 py-2.5 rounded-lg font-medium transition-colors ${buttonColor} ${previewMode ? '' : 'opacity-70 cursor-not-allowed'}`}
          >
            {buttonText}
          </button>
        );

      case 'CODE_EDITOR':
        // For preview mode, use the functional editor
        if (previewMode) {
          // Type guard to ensure we're working with CodeEditorProperties
          const codeProps = component.properties as any;
          return (
            <FunctionalCodeEditor
              code={codeProps.default_code || '// Write your evaluation logic here\nfunction evaluateResponse({ response, criteria }) {\n  // Your evaluation code here\n  return { score: 0, feedback: \"\" };\n}'}
              language={codeProps.language || 'javascript'}
              customLanguage={codeProps.custom_language || ''}
              theme={codeProps.theme || 'dark'}
              lineNumbers={codeProps.line_numbers || true}
              minHeight={codeProps.min_height || 200}
              readOnly={false}
              onLanguageChange={(newLanguage, customLang) => {
                // Update the component properties when language changes
                const updatedProperties = {
                  ...component.properties,
                  language: newLanguage,
                  custom_language: customLang || ''
                };
                // We need to actually update the component properties
                // onSelect() just selects the component, but doesn't update properties
                // The parent component should handle this update
              }}
            />
          );
        }
        
        // For builder mode, use the static preview
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex space-x-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <div className="text-xs text-gray-500">
                {((component.properties as any).language === 'custom' 
                  ? ((component.properties as any).custom_language || 'Custom') 
                  : ((component.properties as any).language || 'JavaScript')).toString().toUpperCase()}
              </div>
            </div>
            <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm text-gray-100 overflow-x-auto">
              <div className="text-purple-400">function</div>
              <div className="ml-4">
                <span className="text-blue-400">evaluateResponse</span>
                <span className="text-gray-300">(</span>
                <span className="text-blue-300">{'{ response, criteria '}</span>
                <span className="text-gray-300">{'}) {'}</span>
              </div>
              <div className="ml-8">
                <span className="text-gray-300">const score = </span>
                <span className="text-green-400">0</span>
                <span className="text-gray-300">;</span>
              </div>
              <div className="ml-8">
                <span className="text-purple-400">for</span>
                <span className="text-gray-300"> (const criterion of criteria) </span>
                <span className="text-gray-300">{'{'}</span>
              </div>
              <div className="ml-12">
                <span className="text-gray-300">score += </span>
                <span className="text-blue-400">calculateScore</span>
                <span className="text-gray-300">(response, criterion);</span>
              </div>
              <div className="ml-8">
                <span className="text-gray-300">{'}'}</span>
              </div>
              <div className="ml-8">
                <span className="text-purple-400">return</span>
                <span className="text-gray-300"> </span>
                <span className="text-gray-300">{'{'}</span>
                <span className="text-gray-300"> score, response </span>
                <span className="text-gray-300">{'}'};</span>
              </div>
              <div className="ml-4">
                <span className="text-gray-300">{'}'}</span>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-gray-600 text-sm">Component preview for {component.type}</p>
          </div>
        );
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`mb-4 rounded-xl transition-all duration-200 ${
        isSelected 
          ? 'ring-2 ring-green-500 bg-green-50 border-green-200' 
          : 'border border-gray-200 hover:border-gray-300'
      } ${isDragging ? 'rotate-3 shadow-lg' : ''}`}
    >
      {/* Component header */}
      {!previewMode && (
        <div 
          className={`flex items-center justify-between p-3 rounded-t-xl ${
            isSelected ? 'bg-green-100' : 'bg-gray-50'
          }`}
        >
          <div className="flex items-center">
            <div 
              {...attributes}
              {...listeners}
              className="mr-2 p-1 text-gray-400 hover:text-green-600 cursor-grab active:cursor-grabbing rounded hover:bg-green-200 transition-colors"
            >
              <GripVertical className="w-4 h-4" />
            </div>
            <IconComponent className="w-4 h-4 mr-2 text-gray-600" />
            <span className="text-sm font-medium text-gray-800">
              {component.properties.label || component.type.replace(/_/g, ' ')}
            </span>
          </div>
          
          <div className="flex items-center space-x-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelect();
              }}
              className="p-1 text-gray-500 hover:text-green-600 rounded hover:bg-green-100 transition-colors"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="p-1 text-gray-500 hover:text-red-600 rounded hover:bg-red-100 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      
      {/* Component content */}
      <div className={`p-4 ${previewMode ? '' : 'pb-5'}`}>
        {renderComponentPreview()}
      </div>
    </div>
  );
};

const DropZone: React.FC<{
  id: string;
  isActive: boolean;
  onAddComponent?: (type: string, section: CanvasSection) => void;
  section: CanvasSection;
}> = ({ id, isActive, onAddComponent, section }) => {
  const { setNodeRef, isOver, active } = useDroppable({
    id,
  });

  // Check if we're dragging a component from the ComponentsPanel
  const isDraggingComponent = active?.data?.current?.isComponent;

  return (
    <div
      ref={setNodeRef}
      className={`my-4 p-6 rounded-xl border-2 border-dashed transition-all duration-200 ${
        isOver && isDraggingComponent
          ? 'border-green-500 bg-green-50 scale-105' 
          : isOver
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-300 hover:border-gray-400'
      }`}
    >
      <div className="text-center">
        <Plus className="w-8 h-8 mx-auto text-gray-400 mb-3" />
        <p className="text-gray-500 text-sm">
          {isOver && isDraggingComponent 
            ? 'Release to drop component here' 
            : isOver
            ? 'Moving component here'
            : `Drop components here or click to add`}
        </p>
        <button
          onClick={() => onAddComponent && onAddComponent('TEXT_INPUT', section)}
          className="mt-3 text-green-600 hover:text-green-700 text-sm font-medium"
        >
          + Add Component
        </button>
      </div>
    </div>
  );
};

const BuilderCanvas: React.FC<BuilderCanvasProps> = ({
  formConfig,
  selectedComponentId,
  onSelectComponent,
  onRemoveComponent,
  setCanvasSection,
  previewMode,
  onAddComponent
}) => {
  const headerDropRef = useRef<HTMLDivElement>(null);
  const bodyDropRef = useRef<HTMLDivElement>(null);

  return (
    <div className="h-full p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Form Header</h2>
            {!previewMode && (
              <button
                onClick={() => setCanvasSection('header')}
                className={`px-3 py-1 text-xs rounded-full ${
                  'header' === 'header'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                Active
              </button>
            )}
          </div>
          
          <div 
            ref={headerDropRef}
            className="min-h-[100px] bg-white rounded-xl border border-gray-200 p-4 shadow-sm transition-all duration-200 hover:shadow-md"
          >
            {formConfig.layout.header.length === 0 ? (
              <DropZone 
                id="header-drop-zone" 
                isActive={false} 
                onAddComponent={onAddComponent}
                section="header"
              />
            ) : (
              <>
                {formConfig.layout.header.map((component, index) => (
                  <BuilderComponent
                    key={component.id}
                    component={component}
                    index={index}
                    section="header"
                    isSelected={selectedComponentId === component.id}
                    onSelect={() => onSelectComponent(component)}
                    onRemove={() => onRemoveComponent(component.id, 'header')}
                    previewMode={previewMode}
                    formConfig={formConfig}
                  />
                ))}
              </>
            )}
          </div>
        </div>

        {/* Body Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Form Body</h2>
            {!previewMode && (
              <button
                onClick={() => setCanvasSection('body')}
                className={`px-3 py-1 text-xs rounded-full ${
                  'body' === 'body'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                Active
              </button>
            )}
          </div>
          
          <div 
            ref={bodyDropRef}
            className="min-h-[300px] bg-white rounded-xl border border-gray-200 p-4 shadow-sm transition-all duration-200 hover:shadow-md"
          >
            {formConfig.layout.body.length === 0 ? (
              <DropZone 
                id="body-drop-zone" 
                isActive={false} 
                onAddComponent={onAddComponent}
                section="body"
              />
            ) : (
              <>
                {formConfig.layout.body.map((component, index) => (
                  <BuilderComponent
                    key={component.id}
                    component={component}
                    index={index}
                    section="body"
                    isSelected={selectedComponentId === component.id}
                    onSelect={() => onSelectComponent(component)}
                    onRemove={() => onRemoveComponent(component.id, 'body')}
                    previewMode={previewMode}
                    formConfig={formConfig}
                  />
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuilderCanvas;