'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  shape?: 'circle' | 'square' | 'rounded';
  src?: string;
  alt?: string;
  fallback?: React.ReactNode;
  className?: string;
  variant?: 'default' | 'gradient' | 'bordered' | 'glow';
  showStatus?: boolean;
}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  (
    {
      size = 'md',
      shape = 'circle',
      variant = 'default',
      src,
      alt,
      fallback,      showStatus = false,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const [imageError, setImageError] = React.useState(false);
    const [imageLoaded, setImageLoaded] = React.useState(false);

    const sizeClasses = {
      xs: 'h-6 w-6 text-xs',
      sm: 'h-8 w-8 text-sm',
      md: 'h-10 w-10 text-sm',
      lg: 'h-12 w-12 text-base',
      xl: 'h-16 w-16 text-lg',
      '2xl': 'h-20 w-20 text-xl',
    };

    const shapeClasses = {
      circle: 'rounded-full',
      square: 'rounded-lg',
      rounded: 'rounded-2xl',
    };

    const variantClasses = {
      default: 'bg-slate-100 border border-slate-200/50',
      gradient: 'bg-gradient-to-br from-emerald-100 to-teal-100 border border-emerald-200/50',
      bordered: 'bg-white border-2 border-slate-300 shadow-sm',
      glow: 'bg-gradient-to-br from-emerald-100 to-teal-100 border border-emerald-200 shadow-lg shadow-emerald-500/20',
    };



    const getStatusSize = (avatarSize: string) => {
      const sizes = {
        xs: 'w-1.5 h-1.5',
        sm: 'w-2 h-2',
        md: 'w-2.5 h-2.5',
        lg: 'w-3 h-3',
        xl: 'w-3.5 h-3.5',
        '2xl': 'w-4 h-4',
      };
      return sizes[avatarSize as keyof typeof sizes] || sizes.md;
    };

    const handleImageError = () => {
      setImageError(true);
    };

    const handleImageLoad = () => {
      setImageLoaded(true);
    };

    React.useEffect(() => {
      if (src) {
        setImageError(false);
        setImageLoaded(false);
      }
    }, [src]);

    return (
      <div
        ref={ref}
        className={cn(
          'relative flex shrink-0 overflow-hidden transition-all duration-200 hover:scale-105',
          sizeClasses[size],
          shapeClasses[shape],
          variantClasses[variant],
          'group',
          className
        )}
        {...props}
      >
        {/* Loading State */}
        {src && !imageLoaded && !imageError && (
          <div className="absolute inset-0 bg-slate-200 animate-pulse" />
        )}

        {/* Image */}
        {src && !imageError ? (
          <img
            src={src}
            alt={alt}
            className={cn(
              'h-full w-full object-cover transition-opacity duration-200',
              imageLoaded ? 'opacity-100' : 'opacity-0'
            )}
            onError={handleImageError}
            onLoad={handleImageLoad}
          />
        ) : (
          /* Fallback */
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-600 font-semibold group-hover:from-emerald-100 group-hover:to-teal-100 group-hover:text-emerald-700 transition-all duration-200">
            {fallback || children}
          </div>
        )}

   

        {/* Hover Overlay for Gradient Variant */}
        {variant === 'glow' && (
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/0 to-teal-400/0 group-hover:from-emerald-400/10 group-hover:to-teal-400/10 transition-all duration-300 rounded-full" />
        )}
      </div>
    );
  }
);
Avatar.displayName = 'Avatar';

interface AvatarImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  className?: string;
}

const AvatarImage = React.forwardRef<HTMLImageElement, AvatarImageProps>(
  ({ className, onError, onLoad, ...props }, ref) => {
    const [loaded, setLoaded] = React.useState(false);
    const [error, setError] = React.useState(false);

    const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
      setLoaded(true);
      onLoad?.(e);
    };

    const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
      setError(true);
      onError?.(e);
    };

    return (
      <img
        ref={ref}
        className={cn(
          'aspect-square h-full w-full object-cover transition-opacity duration-200',
          loaded && !error ? 'opacity-100' : 'opacity-0',
          className
        )}
        onLoad={handleLoad}
        onError={handleError}
        {...props}
      />
    );
  }
);
AvatarImage.displayName = 'AvatarImage';

interface AvatarFallbackProps extends React.HTMLAttributes<HTMLDivElement> {
  delayMs?: number;
  className?: string;
  variant?: 'initials' | 'icon' | 'gradient';
}

const AvatarFallback = React.forwardRef<HTMLDivElement, AvatarFallbackProps>(
  ({ className, children, variant = 'initials', delayMs = 0, ...props }, ref) => {
    const [show, setShow] = React.useState(delayMs === 0);

    React.useEffect(() => {
      if (delayMs > 0) {
        const timer = setTimeout(() => setShow(true), delayMs);
        return () => clearTimeout(timer);
      }
    }, [delayMs]);

    const variantClasses = {
      initials: 'bg-gradient-to-br from-slate-100 to-slate-200 text-slate-700 font-semibold',
      icon: 'bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-700',
      gradient: 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-bold',
    };

    if (!show) return null;

    return (
      <div
        ref={ref}
        className={cn(
          'flex h-full w-full items-center justify-center transition-all duration-200 group-hover:scale-105',
          variantClasses[variant],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
AvatarFallback.displayName = 'AvatarFallback';

// Avatar Group Component for displaying multiple avatars
interface AvatarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  max?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  spacing?: 'tight' | 'normal' | 'loose';
  showMore?: boolean;
}

const AvatarGroup = React.forwardRef<HTMLDivElement, AvatarGroupProps>(
  ({ children, max = 5, size = 'md', spacing = 'normal', showMore = true, className, ...props }, ref) => {
    const childrenArray = React.Children.toArray(children);
    const visibleChildren = childrenArray.slice(0, max);
    const hiddenCount = Math.max(0, childrenArray.length - max);

    const spacingClasses = {
      tight: '-space-x-1',
      normal: '-space-x-2',
      loose: '-space-x-1.5',
    };

    const sizeClasses = {
      xs: 'h-6 w-6 text-xs',
      sm: 'h-8 w-8 text-sm',
      md: 'h-10 w-10 text-sm',
      lg: 'h-12 w-12 text-base',
      xl: 'h-16 w-16 text-lg',
      '2xl': 'h-20 w-20 text-xl',
    };

    return (
      <div
        ref={ref}
        className={cn('flex items-center', spacingClasses[spacing], className)}
        {...props}
      >
        {visibleChildren.map((child, index) => (
          <div key={index} className="ring-2 ring-white rounded-full">
            {child}
          </div>
        ))}
        
        {showMore && hiddenCount > 0 && (
          <div className={cn(
            'flex items-center justify-center bg-gradient-to-br from-slate-200 to-slate-300 text-slate-700 font-semibold rounded-full ring-2 ring-white border border-slate-200',
            sizeClasses[size]
          )}>
            +{hiddenCount}
          </div>
        )}
      </div>
    );
  }
);
AvatarGroup.displayName = 'AvatarGroup';

export { Avatar, AvatarImage, AvatarFallback, AvatarGroup };
