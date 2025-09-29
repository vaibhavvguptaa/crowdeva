'use client';

import * as React from 'react';
import { projectService } from '@/services/projectService';
import { ProjectStatus } from '@/types';


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
  // Simple responsive max-height without ResizeObserver complexity
  return (
    <div className={'max-h-[60vh] overflow-y-auto border-y py-4 ' + className} {...rest}>
      {children}
    </div>
  );
};

/* =========================
   Minimal Button (inline)
   ========================= */
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

/* =========================
   Create Project Modal
   ========================= */
type CreateProjectModalProps = {
  open: boolean;
  setOpen: (v: boolean) => void;
  onCreateProject?: (data: { name: string; description: string; status: ProjectStatus }) => void;
};

const defaultForm = {
  name: '',
  description: '',
  status: 'active' as ProjectStatus,
};

const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ open, setOpen, onCreateProject }) => {
  const resetKeyRef = React.useRef(0);
  const [form, setForm] = React.useState(defaultForm);
  const [touched, setTouched] = React.useState<{ name?: boolean }>({});
  const [isPending, setIsPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const nameError = React.useMemo(() => {
    if (!touched.name) return '';
    if (!form.name.trim()) return 'Project name is required';
    return '';
  }, [form.name, touched.name]);

  const handleClose = React.useCallback(() => {
    setOpen(false);
    resetKeyRef.current += 1;
    setForm(defaultForm);
    setTouched({});
    setError(null);
  }, [setOpen]);

  const onConfirm = React.useCallback(async () => {
    setTouched((t) => ({ ...t, name: true }));
    if (!form.name.trim()) return;

    try {
      setIsPending(true);
      setError(null);

      // Create the project using projectService
      const newProject = await projectService.createProject({
        name: form.name.trim(),
        description: form.description.trim(),
        status: form.status,
      });

      // Pass the actual saved project to the callback instead of just the form data
      onCreateProject?.({
        name: newProject.name,
        description: newProject.description || '',
        status: newProject.status,
      });
      handleClose();
    } catch (e: any) {
      console.error('Error creating project:', e);
      setError(e?.message || 'Failed to create project. Please try again.');
    } finally {
      setIsPending(false);
    }
  }, [form, onCreateProject, handleClose]);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (isOpen) {
        setOpen(true);
      } else {
        handleClose();
      }
    }} key={`create-${resetKeyRef.current}`}>
      <DialogContent onClose={handleClose} className="bg-white">
        <DialogHeader>
          <DialogTitle>Create a new project</DialogTitle>
          <DialogDescription>Provide details for the new project. You can change these later.</DialogDescription>
        </DialogHeader>

        <DialogAutoScrollBody>
          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                onBlur={() => setTouched((t) => ({ ...t, name: true }))}
                className={`w-full rounded-md border text-gray-900 px-3 py-2 text-sm outline-none transition ${
                  nameError ? 'border-red-300 ' : 'border-slate-300 '
                }`}
                placeholder="e.g., Website Revamp Q4"
                autoFocus
              />
              {nameError ? <p className="mt-1 text-xs text-red-600">{nameError}</p> : null}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description (optional)</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="w-full rounded-md border text-gray-900 border-slate-300 px-3 py-2 text-sm outline-none "
                rows={3}
                placeholder="What is this project about?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as ProjectStatus }))}
                className="w-full rounded-md border border-slate-300  px-3 py-2 text-sm outline-none text-gray-900"
              >
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="paused">Paused</option>
                <option value="inactive">Inactive</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            {error ? <p className="text-sm text-red-600">{error}</p> : null}
          </div>
        </DialogAutoScrollBody>

        <DialogFooter>
  <Button
    variant="outline"
    type="button"
    onClick={handleClose}
    disabled={isPending}
    className="text-gray-900 hover:text-gray-950 hover:bg-gray-100 border-gray-200 cursor-pointer disabled:opacity-50 disabled:pointer-events-none transition-colors"
  >
    Cancel
  </Button>

  <Button
    variant="default"
    type="button"
    onClick={onConfirm}
    disabled={!!nameError || isPending}
    className="min-w-28 text-white cursor-pointer bg-green-600 hover:bg-green-700 focus-visible:ring-2 focus-visible:ring-green-500 disabled:bg-green-600/60 disabled:cursor-not-allowed transition-colors"
  >
    {isPending ? 'Creating…' : 'Create project'}
  </Button>
</DialogFooter>

      </DialogContent>
    </Dialog>
  );
};

export default CreateProjectModal;
