"use client";

import React from 'react';

interface AuthHeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
}


export const AuthHeader: React.FC<AuthHeaderProps> = ({ title, subtitle, className = '' }) => {
  return (
    <div className={`text-center mb-4 ${className}`}>
    
      <h1 className="text-xl lg:text-2xl font-bold text-gray-900 mb-1" aria-label={title}>{title}</h1>
      {subtitle && <p className="text-gray-600 text-xs lg:text-sm">{subtitle}</p>}
    </div>
  );
};
