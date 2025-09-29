'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { 
  Save, 
  Code, 
  Download, 
  Upload, 
  FileText, 
  Layout, 
  Settings, 
  Eye,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  GitCompare,
  X,
  Video,
  GripVertical,
  Plus
} from 'lucide-react';

// Component panels
import ComponentsPanel from '@/components/evaluation-builder/ComponentsPanel';
import PropertiesPanel from '@/components/evaluation-builder/PropertiesPanel';
import BuilderCanvas from '@/components/evaluation-builder/BuilderCanvas';
import TemplateLibrary from '@/components/evaluation-builder/TemplateLibrary';
import { ErrorBoundary } from '@/components/Ui/ErrorBoundary';
import { FullScreenLoading } from '@/components/Ui/LoadingOverlay';

// Types
import { 
  ComponentType,
  EvaluationFormConfig,
  FormComponent,
  CanvasSection,
  LoomVideoProperties
} from '@/types';

// Services
import { projectService } from '@/services/projectService';

const initialFormConfig: EvaluationFormConfig = {
  form_version: "1.0",
  project_id: "",
  layout: {
    header: [],
    body: []
  }
};

// Drag overlay component for visual feedback
const DragOverlayComponent: React.FC<{ componentType: ComponentType | null }> = ({ componentType }) => {
  if (!componentType) return null;

  // Map component types to display names
  const componentNames: Record<ComponentType, string> = {
    GRID_CONTAINER: 'Grid Container',
    SECTION_DIVIDER: 'Section Divider',
    TAB_CONTAINER: 'Tab Container',
    ACCORDION_PANEL: 'Accordion Panel',
    RESPONSE_COMPARISON: 'Response Comparison',
    BEST_RESPONSE_SELECTOR: 'Best Response Selector',
    ISSUE_LABELING: 'Issue Labeling',
    SCORING_SCALE: 'Scoring Scale',
    TEXT_ANNOTATION: 'Text Annotation',
    EVALUATION_CRITERIA: 'Evaluation Criteria',
    TEXT_INPUT: 'Text Input',
    TEXTAREA: 'Text Area',
    DROPDOWN: 'Dropdown',
    RADIO_GROUP: 'Radio Group',
    CHECKBOX_GROUP: 'Checkbox Group',
    NUMBER_INPUT: 'Number Input',
    DATETIME_INPUT: 'Date/Time Input',
    TEXT_DISPLAY: 'Text Display',
    RICH_TEXT_EDITOR: 'Rich Text Editor',
    FILE_UPLOAD: 'File Upload',
    JSON_VIEWER: 'JSON Viewer',
    LOOM_VIDEO: 'Loom Video',
    SUBMIT_BUTTON: 'Submit Button',
    SAVE_DRAFT_BUTTON: 'Save Draft Button',
    SKIP_BUTTON: 'Skip/Next Button',
    RESET_BUTTON: 'Reset Form Button',
    CODE_EDITOR: ''
  };

  return (
    <div className="px-4 py-3 bg-white border-2 border-green-500 rounded-xl shadow-lg flex items-center">
      <Plus className="w-5 h-5 text-green-600 mr-2" />
      <span className="font-medium text-gray-800">{componentNames[componentType] || componentType}</span>
    </div>
  );
};

export default function EvaluationBuilderPage({ params }: { params: Promise<{ projectId: string }> }) {
  // Unwrap the params promise
  const unwrappedParams = React.use(params);
  const [formConfig, setFormConfig] = useState<EvaluationFormConfig>({
    ...initialFormConfig,
    project_id: unwrappedParams.projectId
  });
  const [selectedComponent, setSelectedComponent] = useState<FormComponent | null>(null);
  const [showTemplateLibrary, setShowTemplateLibrary] = useState(false);
  const [canvasSection, setCanvasSection] = useState<CanvasSection>('body');
  const [isLoading, setIsLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [showJsonEditor, setShowJsonEditor] = useState(false);
  const [jsonEditorValue, setJsonEditorValue] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draggingComponentType, setDraggingComponentType] = useState<ComponentType | null>(null);
  // State for left panel width
  const [leftPanelWidth, setLeftPanelWidth] = useState<number>(320);
  const [isResizing, setIsResizing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const leftPanelRef = useRef<HTMLDivElement>(null);

  // Set up sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Load existing evaluation structure if available
  useEffect(() => {
    const loadEvaluationStructure = async () => {
      try {
        const structure = await projectService.getEvaluationStructure(unwrappedParams.projectId);
        if (structure) {
          setFormConfig({
            ...structure,
            project_id: unwrappedParams.projectId
          });
        }
      } catch (error) {
        console.error('Error loading evaluation structure:', error);
      }
    };

    loadEvaluationStructure();
  }, [unwrappedParams.projectId]);

  // Handle drag start
  const handleDragStart = (event: any) => {
    const { active } = event;
    setActiveId(active.id);
    
    // If this is a component from the ComponentsPanel, set the dragging component type
    if (active.data.current?.isComponent) {
      setDraggingComponentType(active.data.current.type as ComponentType);
    }
  };

  // Handle drag end
  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    
    // Check if we're dropping a component from the ComponentsPanel
    if (active.data.current?.isComponent && over) {
      const componentType = active.data.current.type as ComponentType;
      // Determine which section we're dropping into based on the drop zone
      let targetSection: CanvasSection = canvasSection; // default to current canvas section
      
      if (over.id === 'header-drop-zone') {
        targetSection = 'header';
      } else if (over.id === 'body-drop-zone') {
        targetSection = 'body';
      } else {
        // If we're dropping over an existing component, add to the same section
        const overSection = getComponentSection(over.id);
        if (overSection) {
          targetSection = overSection;
        }
      }
      
      // Add the component to the target section
      handleAddComponent(componentType, targetSection);
      setActiveId(null);
      setDraggingComponentType(null);
      return;
    }
    
    // Handle reordering of existing components
    if (over && active.id !== over.id) {
      const activeSection = getComponentSection(active.id);
      const overSection = getComponentSection(over.id);
      
      if (activeSection && overSection) {
        const oldIndex = formConfig.layout[activeSection].findIndex((item: FormComponent) => item.id === active.id);
        const newIndex = formConfig.layout[overSection].findIndex((item: FormComponent) => item.id === over.id);
        
        if (oldIndex !== -1 && newIndex !== -1) {
          setFormConfig((prev: EvaluationFormConfig) => {
            const newLayout = { ...prev.layout };
            
            if (activeSection === overSection) {
              // Moving within the same section
              newLayout[activeSection] = arrayMove(newLayout[activeSection], oldIndex, newIndex);
            } else {
              // Moving between sections
              const [movedItem] = newLayout[activeSection].splice(oldIndex, 1);
              newLayout[overSection].splice(newIndex, 0, movedItem);
            }
            
            return { ...prev, layout: newLayout };
          });
        }
      }
    }
    
    setActiveId(null);
    setDraggingComponentType(null);
  };

  // Handle drag cancel
  const handleDragCancel = () => {
    setActiveId(null);
    setDraggingComponentType(null);
  };

  // Helper function to find which section a component belongs to
  const getComponentSection = (componentId: string): CanvasSection | null => {
    if (formConfig.layout.header.some((comp: FormComponent) => comp.id === componentId)) {
      return 'header';
    }
    if (formConfig.layout.body.some((comp: FormComponent) => comp.id === componentId)) {
      return 'body';
    }
    return null;
  };

  // Handle component selection
  const handleSelectComponent = (component: FormComponent | null) => {
    setSelectedComponent(component);
    // We no longer need to switch panels since ComponentsPanel should always be visible
    // The PropertiesPanel will show when a component is selected
  };

  // Add a component to the canvas
  const handleAddComponent = (componentType: ComponentType, section: CanvasSection = 'body') => {
    const newComponent: FormComponent = {
      id: `${componentType.toLowerCase()}_${Date.now()}`,
      type: componentType,
      properties: {
        label: `New ${componentType}`,
        required: false,
      }
    };

    // Add special properties based on component type
    switch (componentType) {
      case 'RESPONSE_COMPARISON':
        newComponent.properties.layout = 'side-by-side';
        newComponent.properties.show_scores = true;
        break;
      case 'SCORING_SCALE':
        newComponent.properties.min = 1;
        newComponent.properties.max = 10;
        newComponent.properties.criteria = ['Accuracy', 'Clarity', 'Relevance'];
        break;
      case 'ISSUE_LABELING':
        newComponent.properties.options = ['Minor Issue', 'Major Issue', 'Cannot Access', 'N/A'];
        break;
      case 'BEST_RESPONSE_SELECTOR':
        newComponent.properties.options = ['Response A', 'Response B'];
        break;
      case 'CHECKBOX_GROUP':
      case 'RADIO_GROUP':
        newComponent.properties.options = ['Option 1', 'Option 2', 'Option 3'];
        break;
      case 'DROPDOWN':
        newComponent.properties.options = ['Select...', 'Option 1', 'Option 2', 'Option 3'];
        newComponent.properties.placeholder = 'Select an option';
        break;
      case 'LOOM_VIDEO':
        // Type assertion to ensure we have the correct properties
        (newComponent.properties as LoomVideoProperties).video_url = '';
        (newComponent.properties as LoomVideoProperties).embed_url = '';
        (newComponent.properties as LoomVideoProperties).width = '100%';
        (newComponent.properties as LoomVideoProperties).height = '300px';
        (newComponent.properties as LoomVideoProperties).show_controls = true;
        break;
    }

    setFormConfig(prev => ({
      ...prev,
      layout: {
        ...prev.layout,
        [section]: [...prev.layout[section], newComponent]
      }
    }));

    // Select the newly added component
    setSelectedComponent(newComponent);
    // We no longer need to switch panels since ComponentsPanel should always be visible
    // The PropertiesPanel will show when a component is selected
  };

  // Update component properties
  const handleUpdateComponent = (componentId: string, newProperties: any, section: CanvasSection = 'body') => {
    setFormConfig(prev => ({
      ...prev,
      layout: {
        ...prev.layout,
        [section]: prev.layout[section].map((comp: FormComponent) => 
          comp.id === componentId ? { ...comp, properties: { ...comp.properties, ...newProperties } } : comp
        )
      }
    }));

    // Update selected component if it's the one being modified
    if (selectedComponent?.id === componentId) {
      setSelectedComponent(prev => prev ? { ...prev, properties: { ...prev.properties, ...newProperties } } : null);
    }
  };

  // Remove a component from the canvas
  const handleRemoveComponent = (componentId: string, section: CanvasSection = 'body') => {
    setFormConfig(prev => ({
      ...prev,
      layout: {
        ...prev.layout,
        [section]: prev.layout[section].filter((comp: FormComponent) => comp.id !== componentId)
      }
    }));

    // Deselect if the removed component was selected
    if (selectedComponent?.id === componentId) {
      setSelectedComponent(null);
    }
  };

  // Export form configuration as JSON
  const handleExportJson = () => {
    const jsonString = JSON.stringify(formConfig, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `evaluation-form-${unwrappedParams.projectId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Import JSON configuration
  const handleImportJson = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        setFormConfig({
          ...json,
          project_id: unwrappedParams.projectId // Ensure project ID is correct
        });
        alert('Form configuration imported successfully!');
      } catch (error) {
        alert('Error parsing JSON file. Please check the file format.');
      }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset input
  };

  // Handle template selection
  const handleSelectTemplate = (template: EvaluationFormConfig) => {
    setFormConfig({
      ...template,
      project_id: unwrappedParams.projectId // Ensure project ID is correct
    });
    setShowTemplateLibrary(false);
    alert('Template applied successfully!');
  };

  // Save form configuration to project
  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Save the form configuration to the project
      await projectService.saveEvaluationStructure(unwrappedParams.projectId, formConfig);
      alert('Form configuration saved successfully!');
      
      // Redirect to the project dashboard after saving
      window.location.href = `/projects/dashboard/${unwrappedParams.projectId}`;
    } catch (error) {
      alert('Error saving form configuration.');
    } finally {
      setIsLoading(false);
    }
  };

  // Get active component for drag overlay
  const activeComponent = activeId 
    ? [...formConfig.layout.header, ...formConfig.layout.body].find((comp: FormComponent) => comp.id === activeId)
    : null;

  // Handle mouse down on the resize handle
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  // Handle mouse move for resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      // Calculate new width based on mouse position
      const newWidth = Math.max(280, Math.min(600, e.clientX));
      setLeftPanelWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  return (
    <ErrorBoundary>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="flex flex-col h-screen bg-gray-50">
          {isLoading && <FullScreenLoading message="Saving form configuration..." />}
          
          {/* Header */}
          <header className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link
                  href="/projects"
                  className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Link>
                <h1 className="text-xl font-semibold text-gray-900">Evaluation Form Builder</h1>
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setPreviewMode(!previewMode)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all ${
                    previewMode 
                      ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  {previewMode ? <Settings className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  <span className="font-medium">{previewMode ? 'Edit' : 'Preview'}</span>
                </button>
                
                <div className="w-px h-6 bg-gray-300"></div>
                
                <button
                  onClick={handleImportJson}
                  className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  <span className="font-medium">Import</span>
                </button>
                
                <button
                  onClick={handleExportJson}
                  className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span className="font-medium">Export</span>
                </button>
                
                <button
                  onClick={() => setShowTemplateLibrary(true)}
                  className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-colors"
                >
                  <Layout className="w-4 h-4" />
                  <span className="font-medium">Templates</span>
                </button>
                
                <div className="w-px h-6 bg-gray-300"></div>
                
                {/* Save button with redirect to dashboard */}
                <div className="relative">
                  <button
                    onClick={handleSave}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors shadow-sm"
                  >
                    <Save className="w-4 h-4" />
                    <span className="font-medium">Save</span>
                  </button>
                  {isLoading && (
                    <Link 
                      href={`/projects/dashboard/${unwrappedParams.projectId}`}
                      className="absolute inset-0"
                    />
                  )}
                </div>
              </div>
            </div>
          </header>

          <div className="flex flex-1 overflow-hidden">
            {/* Left Panel - Components */}
            {!previewMode && (
              <div 
                ref={leftPanelRef}
                className="bg-white border-r border-gray-200 flex flex-col relative"
                style={{ width: `${leftPanelWidth}px` }}
              >
                <ComponentsPanel onAddComponent={(type: ComponentType) => handleAddComponent(type, canvasSection)} />
                
                {/* Resize handle */}
                <div 
                  className="absolute top-0 right-0 h-full w-2 cursor-col-resize flex items-center justify-center group"
                  onMouseDown={handleMouseDown}
                >
                  <div className="w-1 h-10 bg-gray-300 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
              </div>
            )}

            {/* Main Canvas */}
            <div className="flex-1 overflow-auto bg-gray-50">
              <SortableContext
                items={[
                  ...formConfig.layout.header.map((comp: FormComponent) => comp.id),
                  ...formConfig.layout.body.map((comp: FormComponent) => comp.id)
                ]}
                strategy={verticalListSortingStrategy}
              >
                <BuilderCanvas
                  formConfig={formConfig}
                  selectedComponentId={selectedComponent?.id}
                  onSelectComponent={handleSelectComponent}
                  onRemoveComponent={handleRemoveComponent}
                  setCanvasSection={setCanvasSection}
                  previewMode={previewMode}
                  onAddComponent={(type: string, section: CanvasSection) => handleAddComponent(type as ComponentType, section)}
                />
              </SortableContext>
            </div>

            {/* Right Panel - Properties */}
            {!previewMode && selectedComponent && (
              <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
                <PropertiesPanel
                  component={selectedComponent}
                  onUpdateComponent={(newProperties: any) => 
                    handleUpdateComponent(selectedComponent.id, newProperties, canvasSection)
                  }
                  onClose={() => {
                    setSelectedComponent(null);
                  }}
                />
              </div>
            )}
          </div>

          {/* Drag Overlay */}
          <DragOverlay>
            <DragOverlayComponent componentType={draggingComponentType} />
          </DragOverlay>

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
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex-1 overflow-auto p-6">
                  <TemplateLibrary onSelectTemplate={handleSelectTemplate} />
                </div>
              </div>
            </div>
          )}

          {/* Hidden file input for JSON import */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".json"
            className="hidden"
          />
        </div>
      </DndContext>
    </ErrorBoundary>
  );
}