'use client';

import React from 'react';

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
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    </div>
  )
);
DialogContent.displayName = 'DialogContent';

type DialogHeaderProps = React.HTMLAttributes<HTMLDivElement>;
const DialogHeader: React.FC<DialogHeaderProps> = ({ className = '', ...props }) => (
  <div className={'flex flex-col space-y-1.5 text-center sm:text-left ' + className} {...props} />
);
DialogHeader.displayName = 'DialogHeader';

type DialogTitleProps = React.HTMLAttributes<HTMLHeadingElement>;
const DialogTitle: React.FC<DialogTitleProps> = ({ className = '', ...props }) => (
  <h3
    className={'text-lg font-semibold leading-none tracking-tight ' + className}
    {...props}
  />
);
DialogTitle.displayName = 'DialogTitle';

type DialogDescriptionProps = React.HTMLAttributes<HTMLParagraphElement>;
const DialogDescription: React.FC<DialogDescriptionProps> = ({ className = '', ...props }) => (
  <p className={'text-sm text-muted-foreground ' + className} {...props} />
);
DialogDescription.displayName = 'DialogDescription';

type DialogFooterProps = React.HTMLAttributes<HTMLDivElement>;
const DialogFooter: React.FC<DialogFooterProps> = ({ className = '', ...props }) => (
  <div
    className={'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 ' + className}
    {...props}
  />
);
DialogFooter.displayName = 'DialogFooter';

export { Dialog, DialogOverlay, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter };