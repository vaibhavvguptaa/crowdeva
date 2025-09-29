// components/Ui/Card.tsx - Fixed version with proper ref handling
'use client';
import React, { memo, forwardRef } from 'react';
import { RotateCw } from 'lucide-react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
}

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  showRefresh?: boolean;
  onRefresh?: () => void;
  rightContent?: React.ReactNode;
  className?: string;
  loading?: boolean;
}

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

// Fix: Use union type for ref and handle conditionally
export const Card = memo(forwardRef<HTMLDivElement | HTMLButtonElement, CardProps>(({
  children,
  className = '',
  onClick,
  hover = false,
  padding = 'md',
  loading = false,
  disabled = false
}, ref) => {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  const classes = `
    bg-white border border-gray-200 rounded-lg shadow-sm
    ${paddingClasses[padding]}
    ${hover ? 'hover:shadow-md transition-shadow duration-200' : ''}
    ${onClick && !disabled ? 'cursor-pointer' : ''}
    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
    ${loading ? 'animate-pulse' : ''}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  if (onClick) {
    return (
      <button
        ref={ref as React.ForwardedRef<HTMLButtonElement>}
        className={classes}
        onClick={disabled || loading ? undefined : onClick}
        disabled={disabled || loading}
        onKeyDown={(e: React.KeyboardEvent) => {
          if (!disabled && !loading && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            onClick();
          }
        }}
      >
        {children}
      </button>
    );
  }

  return (
    <div
      ref={ref as React.ForwardedRef<HTMLDivElement>}
      className={classes}
    >
      {children}
    </div>
  );
}));

Card.displayName = 'Card';

export const CardHeader = memo<CardHeaderProps>(({
  title,
  subtitle,
  showRefresh = true,
  onRefresh,
  rightContent,
  className = '',
  loading = false
}) => {
  return (
    <div className={`flex items-center justify-between mb-4 ${className}`}>
      <div className="flex-1">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {subtitle && (
          <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
        )}
      </div>
      <div className="flex items-center space-x-2">
        {rightContent}
        {showRefresh && onRefresh && (
          <button
            onClick={onRefresh}
            disabled={loading}
            className={`p-2 hover:bg-gray-100 rounded-lg transition-colors
              ${loading ? 'animate-spin' : ''}`}
            aria-label="Refresh data"
          >
            <RotateCw className="w-4 h-4 text-gray-500" />
          </button>
        )}
      </div>
    </div>
  );
});

CardHeader.displayName = 'CardHeader';

export const CardContent = memo<CardContentProps>(({
  children,
  className = ''
}) => {
  return (
    <div className={`${className}`}>
      {children}
    </div>
  );
});

CardContent.displayName = 'CardContent';

export const CardFooter = memo<CardFooterProps>(({
  children,
  className = ''
}) => {
  return (
    <div className={`mt-4 pt-4 border-t border-gray-200 ${className}`}>
      {children}
    </div>
  );
});

CardFooter.displayName = 'CardFooter';

// Alternative approach - Separate components for better type safety
interface ClickableCardProps extends Omit<CardProps, 'onClick'> {
  onClick: () => void;
}

interface StaticCardProps extends Omit<CardProps, 'onClick'> {
  onClick?: never;
}

export const ClickableCard = memo(forwardRef<HTMLButtonElement, ClickableCardProps>(({
  children,
  className = '',
  onClick,
  hover = true,
  padding = 'md',
  loading = false,
  disabled = false
}, ref) => {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  const classes = `
    bg-white border border-gray-200 rounded-lg shadow-sm
    ${paddingClasses[padding]}
    ${hover ? 'hover:shadow-md transition-shadow duration-200' : ''}
    cursor-pointer
    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
    ${loading ? 'animate-pulse' : ''}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <button
      ref={ref}
      className={classes}
      onClick={disabled || loading ? undefined : onClick}
      disabled={disabled || loading}
      onKeyDown={(e: React.KeyboardEvent) => {
        if (!disabled && !loading && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {children}
    </button>
  );
}));

ClickableCard.displayName = 'ClickableCard';

export const StaticCard = memo(forwardRef<HTMLDivElement, StaticCardProps>(({
  children,
  className = '',
  hover = false,
  padding = 'md',
  loading = false,
  disabled = false
}, ref) => {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  const classes = `
    bg-white border border-gray-200 rounded-lg shadow-sm
    ${paddingClasses[padding]}
    ${hover ? 'hover:shadow-md transition-shadow duration-200' : ''}
    ${disabled ? 'opacity-50' : ''}
    ${loading ? 'animate-pulse' : ''}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <div ref={ref} className={classes}>
      {children}
    </div>
  );
}));

StaticCard.displayName = 'StaticCard';

// Loading and Error Components remain the same
export const LoadingCard = memo<{ className?: string }>(({ className = '' }) => (
  <Card className={`animate-pulse ${className}`}>
    <div className="space-y-4">
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      <div className="h-8 bg-gray-200 rounded"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
    </div>
  </Card>
));

LoadingCard.displayName = 'LoadingCard';

interface ErrorCardProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorCard = memo<ErrorCardProps>(({
  title = 'Error',
  message,
  onRetry,
  className = ''
}) => (
  <Card className={`border-red-200 ${className}`}>
    <div className="text-center py-8">
      <h3 className="text-lg font-semibold text-red-900 mb-2">{title}</h3>
      <p className="text-red-600 mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Try Again
        </button>
      )}
    </div>
  </Card>
));

ErrorCard.displayName = 'ErrorCard';

export default Card;
