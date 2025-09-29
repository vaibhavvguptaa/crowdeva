// Types for the Evaluation Form Builder

// Component types
export type ComponentType = 
  // Layout components
  | 'GRID_CONTAINER'
  | 'SECTION_DIVIDER'
  | 'TAB_CONTAINER'
  | 'ACCORDION_PANEL'
  
  | 'RESPONSE_COMPARISON'
  | 'BEST_RESPONSE_SELECTOR'
  | 'ISSUE_LABELING'
  | 'SCORING_SCALE'
  | 'TEXT_ANNOTATION'
  | 'EVALUATION_CRITERIA'
  
  // Input components
  | 'TEXT_INPUT'
  | 'TEXTAREA'
  | 'DROPDOWN'
  | 'RADIO_GROUP'
  | 'CHECKBOX_GROUP'
  | 'NUMBER_INPUT'
  | 'DATETIME_INPUT'
  
  // Media components
  | 'TEXT_DISPLAY'
  | 'RICH_TEXT_EDITOR'
  | 'CODE_EDITOR'  // New code editor component
  | 'FILE_UPLOAD'
  | 'JSON_VIEWER'
  | 'LOOM_VIDEO'
  
  // Action components
  | 'SUBMIT_BUTTON'
  | 'SAVE_DRAFT_BUTTON'
  | 'SKIP_BUTTON'
  | 'RESET_BUTTON';

// Canvas sections
export type CanvasSection = 'header' | 'body';

// Common properties for all components
interface BaseComponentProperties {
  label?: string;
  description?: string;
  placeholder?: string;
  required?: boolean;
  help_text?: string;
  visible_to?: ('client' | 'vendor' | 'developer' | 'admin')[];
  width?: string;
  height?: string;
  options?: string[];
  min?: number;
  max?: number;
  step?: number;
  criteria?: Array<string | { id: string; label: string; description?: string }>;
  layout?: 'side-by-side' | 'stacked' | 'tabbed' | 'vertical' | 'horizontal';
  show_scores?: boolean;
  show_time?: boolean;
  content?: string;
  text?: string;
  allow_multiple?: boolean;
  rows?: number;
}

// Component-specific properties
interface ResponseComparisonProperties extends BaseComponentProperties {
  layout?: 'side-by-side' | 'stacked' | 'tabbed';
  show_scores?: boolean;
  response_sources?: string[];
}

interface BestResponseSelectorProperties extends BaseComponentProperties {
  options?: string[];
  allow_comments?: boolean;
}

interface IssueLabelingProperties extends BaseComponentProperties {
  options?: string[];
  allow_multiple?: boolean;
  allow_custom?: boolean;
}

interface ScoringScaleProperties extends BaseComponentProperties {
  min?: number;
  max?: number;
  step?: number;
  criteria?: string[];
  labels?: { [key: number]: string };
}

interface TextAnnotationProperties extends BaseComponentProperties {
  highlight_colors?: string[];
  categories?: string[];
  allow_comments?: boolean;
}

interface EvaluationCriteriaProperties extends BaseComponentProperties {
  criteria?: Array<{
    id: string;
    label: string;
    description?: string;
  }>;
  allow_partial?: boolean;
}

interface TextInputProperties extends BaseComponentProperties {
  default_value?: string;
  min_length?: number;
  max_length?: number;
  validation?: string;
}

interface TextareaProperties extends BaseComponentProperties {
  default_value?: string;
  min_length?: number;
  max_length?: number;
  rows?: number;
}

interface DropdownProperties extends BaseComponentProperties {
  options?: string[];
  default_value?: string;
  allow_multiple?: boolean;
}

interface RadioGroupProperties extends BaseComponentProperties {
  options?: string[];
  default_value?: string;
  layout?: 'vertical' | 'horizontal';
}

interface CheckboxGroupProperties extends BaseComponentProperties {
  options?: string[];
  default_values?: string[];
  layout?: 'vertical' | 'horizontal';
}

interface NumberInputProperties extends BaseComponentProperties {
  default_value?: number;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}

interface DatetimeInputProperties extends BaseComponentProperties {
  default_value?: string;
  min_date?: string;
  max_date?: string;
  show_time?: boolean;
}

interface TextDisplayProperties extends BaseComponentProperties {
  content?: string;
  format?: 'plain' | 'code' | 'html';
}

interface RichTextEditorProperties extends BaseComponentProperties {
  default_content?: string;
  toolbar_options?: string[];
  min_height?: number;
}

interface CodeEditorProperties extends BaseComponentProperties {
  default_code?: string;
  language?: string;
  custom_language?: string;
  theme?: 'light' | 'dark';
  line_numbers?: boolean;
  min_height?: number;
}

interface FileUploadProperties extends BaseComponentProperties {
  allowed_types?: string[];
  max_size?: number;
  multiple?: boolean;
}

interface JsonViewerProperties extends BaseComponentProperties {
  default_content?: object;
  collapsed?: boolean;
  theme?: 'light' | 'dark';
}

export interface LoomVideoProperties extends BaseComponentProperties {
  video_url?: string;
  embed_url?: string;
  width?: string;
  height?: string;
  autoplay?: boolean;
  loop?: boolean;
  show_controls?: boolean;
}

interface ButtonProperties extends BaseComponentProperties {
  text?: string;
  icon?: string;
  size?: 'small' | 'medium' | 'large';
  variant?: 'primary' | 'secondary' | 'outline' | 'text';
  action?: 'submit' | 'save' | 'reset' | 'skip' | 'custom';
  action_url?: string;
}

export type ComponentProperties = 
  | ResponseComparisonProperties
  | BestResponseSelectorProperties
  | IssueLabelingProperties
  | ScoringScaleProperties
  | TextAnnotationProperties
  | EvaluationCriteriaProperties
  | TextInputProperties
  | TextareaProperties
  | DropdownProperties
  | RadioGroupProperties
  | CheckboxGroupProperties
  | NumberInputProperties
  | DatetimeInputProperties
  | TextDisplayProperties
  | RichTextEditorProperties
  | CodeEditorProperties  // Add the new interface
  | FileUploadProperties
  | JsonViewerProperties
  | LoomVideoProperties
  | ButtonProperties
  | BaseComponentProperties;

// Form component
export interface FormComponent {
  id: string;
  type: ComponentType;
  properties: ComponentProperties;
  children?: FormComponent[];
}

// Complete form configuration
export interface EvaluationFormConfig {
  form_version: string;
  project_id: string;
  layout: {
    header: FormComponent[];
    body: FormComponent[];
  };
  metadata?: {
    created_at?: string;
    updated_at?: string;
    created_by?: string;
    name?: string;
    description?: string;
    tags?: string[];
  };
}

// Template interface
export interface FormTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  thumbnail?: string;
  config: EvaluationFormConfig;
}