import React, { useState, useRef, useEffect, useCallback } from "react";
import { Folder, Download, Check } from "lucide-react";


interface SampleProject {
  id: string;
  name: string;
  description: string;
  selected: boolean;
  totalTasks: number;
}


interface ImportSampleProjectsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportProjects: (selectedProjects: SampleProject[]) => Promise<void>;
  isLoading?: boolean;
}


type DialogRootProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
};


const Dialog: React.FC<DialogRootProps> = ({ open, onOpenChange, children }) => {
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false);
    };
    if (open) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onOpenChange]);


  if (!open) return null;
  return <div>{children}</div>;
};


type DialogOverlayProps = React.HTMLAttributes<HTMLDivElement>;
const DialogOverlay: React.FC<DialogOverlayProps> = ({ className = '', ...props }) => (
  <div
    className={
      'fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out ' +
      'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 ' +
      className
    }
    {...props}
  />
);


type DialogContentProps = React.HTMLAttributes<HTMLDivElement> & {
  onClose?: () => void;
};
const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(
  ({ className = '', children, onClose, ...props }, ref) => (
    <div>
      <DialogOverlay onClick={onClose} />
      <div
        ref={ref}
        className={
          'fixed left-1/2 top-1/2 z-50 grid w-full max-w-lg -translate-x-1/2 -translate-y-1/2 ' +
          'gap-4 border bg-background px-8 py-6 shadow-lg duration-200 ' +
          'data-[state=open]:animate-in data-[state=closed]:animate-out ' +
          'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 ' +
          'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 ' +
          'sm:rounded-md ' +
          className
        }
        {...props}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
        <button
          aria-label="Close"
          className="absolute right-8 top-7 opacity-70 transition-opacity hover:opacity-100 focus:outline-none"
          onClick={onClose}
          type="button"
        >
          {/* X icon (lucide simplified) */}
          <svg viewBox="0 0 24 24" className="size-4" stroke="black" fill="none">
            <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M18 6 6 18M6 6l12 12" className='cursor-pointer' />
          </svg>
          <span className="sr-only cursor-pointer text-gray-500">Close</span>
        </button>
      </div>
    </div>
  )
);
DialogContent.displayName = 'DialogContent';


const DialogHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className = '', ...props }) => (
  <div
    data-dialog-header="true"
    className={'flex flex-col space-y-1.5 text-center pb-2 sm:text-left max-w-full min-w-1 ' + className}
    {...props}
  />
);


const DialogFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className = '', ...props }) => (
  <div
    data-dialog-footer="true"
    className={'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 ' + className}
    {...props}
  />
);


const DialogTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className = '', ...props }, ref) => (
    <h2 ref={ref} className={'comet-title-s pr-8 break-words text-lg font-medium text-black placeholder:text-gray-400 ' + className} {...props} />
  )
);
DialogTitle.displayName = 'DialogTitle';


const DialogDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className = '', ...props }, ref) => (
    <p
      ref={ref}
      className={'pt-4 comet-body-s text-gray-600 text-muted-foreground break-words whitespace-pre-wrap text-sm ' + className}
      {...props}
    />
  )
);
DialogDescription.displayName = 'DialogDescription';


type DialogAutoScrollBodyProps = React.HTMLAttributes<HTMLDivElement>;
const DialogAutoScrollBody: React.FC<DialogAutoScrollBodyProps> = ({ className = '', children, ...rest }) => {
  return (
    <div className={'max-h-[60vh] overflow-y-auto border-y py-4 ' + className} {...rest}>
      {children}
    </div>
  );
};



type ButtonVariant = 'default' | 'special' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'minimal' | 'link';
type ButtonSize = 'default' | 'sm' | '2xs' | '3xs' | 'lg' | 'icon' | 'icon-sm' | 'icon-lg' | 'icon-xs' | 'icon-2xs' | 'icon-3xs';


type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  badge?: boolean;
};


const buttonBase =
  'comet-body-s-accented inline-flex items-center justify-center whitespace-nowrap rounded-md transition-colors ' +
  'focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50';


const variantClass: Record<ButtonVariant, string> = {
  default: 'bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-active',
  special: 'bg-[#19A979] text-white hover:bg-[#1E8A66] active:bg-[#1A7557]',
  destructive:
    'border border-destructive bg-background text-destructive hover:bg-destructive/5 active:bg-destructive/10',
  outline:
    'border border-border bg-background hover:bg-primary-foreground hover:text-foreground active:bg-primary-100 active:text-foreground',
  secondary:
    'bg-primary-100 text-primary hover:bg-secondary hover:text-primary-hover active:bg-secondary active:text-primary-active',
  ghost: 'font-normal hover:text-primary-hover active:text-primary-active',
  minimal: 'font-normal text-light-slate hover:text-foreground active:text-foreground',
  link: 'text-primary underline-offset-4 hover:underline',
};


const sizeClass: Record<ButtonSize, string> = {
  default: 'h-10 px-4 py-2',
  sm: 'h-8 px-3',
  '2xs': 'comet-body-xs h-6 px-2',
  '3xs': 'comet-body-xs h-4 px-1',
  lg: 'h-11 px-8',
  icon: 'size-10',
  'icon-sm': 'size-8',
  'icon-lg': 'size-11',
  'icon-xs': 'size-7',
  'icon-2xs': 'size-6',
  'icon-3xs': 'size-4',
};


const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'default', size = 'default', badge = false, ...props }, ref) => (
    <button
      ref={ref}
      className={`${badge ? 'comet-button-badge' : ''} ${buttonBase} ${variantClass[variant]} ${sizeClass[size]} ${className}`}
      {...props}
    />
  )
);
Button.displayName = 'Button';


export default function ImportSampleProjectsModal({
  isOpen,
  onClose,
  onImportProjects,
  isLoading = false,
}: ImportSampleProjectsModalProps) {
  const [sampleProjects, setSampleProjects] = useState<SampleProject[]>([]);


  // Initialize sample projects with RLHF LLM reviewing datasets
  useEffect(() => {
    if (isOpen) {
      const rlhfSampleProjects: SampleProject[] = [
        {
          id: "rlhf-001",
          name: "LLM Response Quality Evaluation",
          description: "Evaluate the quality of LLM responses to various prompts focusing on accuracy, relevance, and helpfulness.",
          selected: false,
          totalTasks: 150
        },
        {
          id: "rlhf-002",
          name: "Safety and Bias Assessment",
          description: "Assess LLM responses for potential safety issues, biases, and ethical concerns across different domains.",
          selected: false,
          totalTasks: 200
        },
        {
          id: "rlhf-003",
          name: "Preference-Based Response Ranking",
          description: "Rank multiple LLM responses to the same prompt based on preference, helping to fine-tune the model.",
          selected: false,
          totalTasks: 120
        }
      ];
      setSampleProjects(rlhfSampleProjects);
    }
  }, [isOpen]);


  const selectedCount = sampleProjects.filter((p) => p.selected).length;


  const toggleProject = useCallback((id: string) => {
    setSampleProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, selected: !p.selected } : p))
    );
  }, []);


  const handleImport = useCallback(async () => {
    if (selectedCount === 0) return;
    const selectedProjects = sampleProjects.filter((p) => p.selected);
    try {
      await onImportProjects(selectedProjects);
      setSampleProjects((prev) => prev.map((p) => ({ ...p, selected: false })));
      onClose();
    } catch (error) {
      console.error("Failed to import projects:", error);
      // Show a user-friendly error message
      const errorMessage = error instanceof Error 
        ? error.message.includes('fetch') 
          ? 'Network error. Please check your connection and try again.' 
          : error.message.includes('Authentication') 
            ? 'Please sign in to import projects.' 
            : error.message
        : "Failed to import projects";
      // In a real implementation, you would show this error to the user
      // For now, we'll just log it
      console.error("Import error:", errorMessage);
    }
  }, [onImportProjects, onClose, sampleProjects, selectedCount]);


  return (
    <Dialog open={isOpen} onOpenChange={(v) => (v ? {} : onClose())}>
      <DialogContent onClose={onClose} className="bg-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5 text-green-600" />
            Import Sample Projects
          </DialogTitle>
          <DialogDescription>
            Choose from our curated sample projects to get started quickly. Each project comes with pre-configured tasks and evaluation criteria.
          </DialogDescription>
        </DialogHeader>


        <DialogAutoScrollBody>
          <div className="space-y-3 pt-2">
            {sampleProjects.map((project) => (
              <div
                key={project.id}
                onClick={() => !isLoading && toggleProject(project.id)}
                className={`flex items-start gap-3 p-4 border rounded-lg transition cursor-pointer ${
                  project.selected
                    ? "border-green-400 bg-green-50"
                    : "border-slate-200 hover:bg-slate-50"
                } ${isLoading ? "opacity-60 cursor-not-allowed" : ""}`}
              >
                {/* Checkbox */}
                <input
                  type="checkbox"
                  checked={project.selected}
                  onChange={() => !isLoading && toggleProject(project.id)}
                  className="mt-1 w-4 h-4 text-green-600 border-slate-300 rounded focus:ring-green-500"
                  disabled={isLoading}
                  onClick={(e) => e.stopPropagation()}
                />


                <div className="flex-shrink-0">
                  <div className="h-10 w-10 flex items-center justify-center bg-slate-100 rounded-lg">
                    <Folder className="w-5 h-5 text-slate-600" />
                  </div>
                </div>


                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-base text-slate-800 mb-2">
                    {project.name}
                  </h3>
                  <p className="text-sm text-slate-600 mb-2 leading-relaxed">
                    {project.description}
                  </p>
                  <p className="text-xs text-slate-500">
                    {project.totalTasks} tasks included
                  </p>
                </div>


                {project.selected && (
                  <div className="flex-shrink-0">
                    <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </DialogAutoScrollBody>


        <DialogFooter>
          <div className="flex justify-between items-center w-full">
            <span className="text-sm text-slate-600">
              {selectedCount > 0
                ? `${selectedCount} project(s) ready to import`
                : "Select projects to import"}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
                className="text-gray-900 hover:text-gray-950 hover:bg-gray-100 border-gray-200 cursor-pointer disabled:opacity-50 disabled:pointer-events-none transition-colors"
              >
                Cancel
              </Button>
              <Button
                onClick={handleImport}
                disabled={selectedCount === 0 || isLoading}
                className="min-w-32 text-white cursor-pointer bg-green-600 hover:bg-green-700 focus-visible:ring-2 focus-visible:ring-green-500 disabled:bg-green-600/60 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? "Importing..." : `Import ${selectedCount > 0 ? `(${selectedCount})` : ''}`}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}