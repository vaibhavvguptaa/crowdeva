'use client';

import React, { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { 
  Grid,
  Divide,
  PanelRight,
  FolderKanban,
  GitCompare,
  RadioTower,
  Tag,
  Star,
  Edit,
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
  Video,
  Code,
  Plus
} from 'lucide-react';
import { ComponentType } from '@/types/evaluation-builder';

interface ComponentsPanelProps {
  onAddComponent: (type: ComponentType) => void;
}

interface ComponentCategory {
  id: string;
  name: string;
  components: {
    type: ComponentType;
    name: string;
    icon: React.ElementType;
    description?: string;
  }[];
}

const DraggableComponent: React.FC<{
  type: ComponentType;
  name: string;
  icon: React.ElementType;
  description?: string;
  onAddComponent: (type: ComponentType) => void;
}> = ({ type, name, icon: Icon, description, onAddComponent }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `component-${type}`,
    data: { type, isComponent: true }
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: isDragging ? 1000 : 'auto',
    position: isDragging ? 'relative' as const : 'static' as const,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`cursor-grab active:cursor-grabbing transition-all duration-200 ${
        isDragging ? 'scale-105 shadow-lg opacity-90' : 'scale-100'
      }`}
    >
      <button
        onClick={() => onAddComponent(type)}
        className="flex items-start p-4 border border-gray-200 rounded-xl hover:border-green-400 hover:bg-green-50 transition-all duration-200 text-left w-full shadow-sm hover:shadow-md group"
      >
        <div className="mr-3 mt-0.5 flex-shrink-0">
          <Icon className="w-5 h-5 text-gray-600 group-hover:text-green-600 transition-colors" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-gray-900 truncate group-hover:text-green-700 transition-colors">{name}</div>
          {description && (
            <div className="text-xs text-gray-500 mt-1 truncate">{description}</div>
          )}
        </div>
        <div className="ml-2 flex-shrink-0">
          <Plus className="w-4 h-4 text-gray-400 group-hover:text-green-500 transition-colors" />
        </div>
      </button>
    </div>
  );
};

const ComponentsPanel: React.FC<ComponentsPanelProps> = ({ onAddComponent }) => {
  const [activeCategory, setActiveCategory] = useState<string>('layout');

  // Define component categories
  const categories: ComponentCategory[] = [
    {
      id: 'layout',
      name: 'Layout',
      components: [
        { type: 'GRID_CONTAINER', name: 'Grid Container', icon: Grid, description: 'Create a responsive grid layout' },
        { type: 'SECTION_DIVIDER', name: 'Section Divider', icon: Divide, description: 'Add a visual section break' },
        { type: 'TAB_CONTAINER', name: 'Tab Container', icon: PanelRight, description: 'Organize content in tabs' },
        { type: 'ACCORDION_PANEL', name: 'Accordion Panel', icon: FolderKanban, description: 'Collapsible content panel' },
      ],
    },
    {
      id: 'llm-evaluation',
      name: 'LLM Evaluation',
      components: [
        { type: 'RESPONSE_COMPARISON', name: 'Response Comparison', icon: GitCompare, description: 'Compare multiple LLM responses' },
        { type: 'BEST_RESPONSE_SELECTOR', name: 'Best Response Selector', icon: RadioTower, description: 'Select the best response' },
        { type: 'ISSUE_LABELING', name: 'Issue Labeling', icon: Tag, description: 'Label issues in responses' },
        { type: 'SCORING_SCALE', name: 'Scoring Scale', icon: Star, description: 'Rate responses on a scale' },
        { type: 'TEXT_ANNOTATION', name: 'Text Annotation', icon: Edit, description: 'Highlight and annotate text' },
        { type: 'EVALUATION_CRITERIA', name: 'Evaluation Criteria', icon: CheckSquare, description: 'Define custom criteria' },
      ],
    },
    {
      id: 'input',
      name: 'Input',
      components: [
        { type: 'TEXT_INPUT', name: 'Text Input', icon: Type, description: 'Single line text input' },
        { type: 'TEXTAREA', name: 'Text Area', icon: AlignLeft, description: 'Multi-line text input' },
        { type: 'DROPDOWN', name: 'Dropdown', icon: List, description: 'Dropdown selection' },
        { type: 'RADIO_GROUP', name: 'Radio Group', icon: ToggleLeft, description: 'Single choice options' },
        { type: 'CHECKBOX_GROUP', name: 'Checkbox Group', icon: CheckCheck, description: 'Multiple choice options' },
        { type: 'NUMBER_INPUT', name: 'Number Input', icon: Hash, description: 'Numeric input field' },
        { type: 'DATETIME_INPUT', name: 'Date/Time Input', icon: Calendar, description: 'Date and time picker' },
      ],
    },
    {
      id: 'media',
      name: 'Media',
      components: [
        { type: 'TEXT_DISPLAY', name: 'Text Display', icon: FileTextIcon, description: 'Display formatted text' },
        { type: 'RICH_TEXT_EDITOR', name: 'Rich Text Editor', icon: PenTool, description: 'WYSIWYG text editor' },
        { type: 'CODE_EDITOR', name: 'Code Editor', icon: Code, description: 'Interactive code editor with execution capabilities' }, // Updated description
        { type: 'FILE_UPLOAD', name: 'File Upload', icon: Upload, description: 'File upload component' },
        { type: 'JSON_VIEWER', name: 'JSON Viewer', icon: FileJson, description: 'Display JSON data' },
        { type: 'LOOM_VIDEO', name: 'Loom Video', icon: Video, description: 'Embed Loom video recordings' },
      ],
    },
    {
      id: 'action',
      name: 'Action',
      components: [
        { type: 'SUBMIT_BUTTON', name: 'Submit Button', icon: Send, description: 'Form submission button' },
        { type: 'SAVE_DRAFT_BUTTON', name: 'Save Draft Button', icon: Save, description: 'Save without submitting' },
        { type: 'SKIP_BUTTON', name: 'Skip/Next Button', icon: SkipForward, description: 'Skip to next item' },
        { type: 'RESET_BUTTON', name: 'Reset Form Button', icon: RotateCcw, description: 'Clear all form fields' },
      ],
    },
  ];

  // Find the active category object
  const activeCategoryObj = categories.find(cat => cat.id === activeCategory) || categories[0];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Components</h2>
      </div>

      {/* Category tabs */}
      <div className="border-b border-gray-200">
        <div className="flex overflow-x-auto py-2 px-2 space-x-1">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => {
                setActiveCategory(category.id);
              }}
              className={`px-3 py-2 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                activeCategory === category.id
                  ? 'bg-green-100 text-green-800'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Components list */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            {activeCategoryObj.name} Components
          </h3>
          
          <div className="grid grid-cols-1 gap-3">
            {activeCategoryObj.components.map(component => (
              <DraggableComponent
                key={component.type}
                type={component.type}
                name={component.name}
                icon={component.icon}
                description={component.description}
                onAddComponent={onAddComponent}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComponentsPanel;