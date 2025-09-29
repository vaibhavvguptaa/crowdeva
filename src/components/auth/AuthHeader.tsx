"use client";

import React from 'react';
import Image from 'next/image';

interface AuthHeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
}

/**
 * Shared header (icon + title + subtitle) for auth pages to reduce duplication.
 */
export const AuthHeader: React.FC<AuthHeaderProps> = ({ title, subtitle, className = '' }) => {
  return (
    <div className={`text-center mb-4 ${className}`}>
      <div className="flex justify-center mb-3">
        <Image
          src="/logo.png"
          alt="CrowdEval Logo"
          width={180} // increased size for zoom effect
          height={72}
          priority
          className="h-14 w-auto object-contain drop-shadow-sm select-none transition-transform duration-300"/>
      </div>
      <h1 className="text-xl lg:text-2xl font-bold text-gray-900 mb-1" aria-label={title}>{title}</h1>
      {subtitle && <p className="text-gray-600 text-xs lg:text-sm">{subtitle}</p>}
    </div>
  );
};
