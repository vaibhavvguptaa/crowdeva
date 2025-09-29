"use client";

import React, { useState, useEffect } from 'react';
import { AuthUserType, REALM_CONFIGS } from '@/types/auth';
import { FeatureList } from './FeatureList';

interface AnimatedContentProps {
  activeTab: AuthUserType;
  isTransitioning?: boolean;
}

export const AnimatedContent: React.FC<AnimatedContentProps> = ({
  activeTab,
  isTransitioning = false,
}) => {
  const [displayTab, setDisplayTab] = useState<AuthUserType>(activeTab);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (activeTab !== displayTab) {
      setIsAnimating(true);
      
      // Brief delay to start the fade-out animation
      const timer = setTimeout(() => {
        setDisplayTab(activeTab);
        
        // End animation after content change
        setTimeout(() => setIsAnimating(false), 50);
      }, 150);

      return () => clearTimeout(timer);
    }
  }, [activeTab, displayTab]);

  const currentConfig = REALM_CONFIGS[displayTab];

  return (
  <div className="bg-gradient-to-br from-green-600 to-green-700 p-4 lg:p-6 flex flex-col justify-center text-white relative overflow-hidden h-full">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full translate-x-1/2 -translate-y-1/2 transition-all duration-500"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -translate-x-1/2 translate-y-1/2 transition-all duration-500"></div>
      
      <div className="relative z-10">
        <div className="max-w-md mx-auto">
          {/* Animated content container */}
          <div className={`transition-all duration-300 ease-in-out ${
            isAnimating || isTransitioning 
              ? 'opacity-0 transform translate-y-2' 
              : 'opacity-100 transform translate-y-0'
          }`}>
            <h2 className="text-xl lg:text-2xl font-bold mb-3 lg:mb-4">
              {currentConfig.displayName.replace('For ', '')} Platform
            </h2>
            <p className="text-green-100 text-sm lg:text-base mb-4 lg:mb-6 leading-relaxed">
              {currentConfig.description}
            </p>
            
            <div className="mb-4 lg:mb-6">
              <FeatureList activeTab={displayTab as any} />
            </div>
            
            <div className="border-t border-green-500/30 pt-3 lg:pt-4">
             
            </div>
          </div>
        </div>
      </div>
      
      {/* Loading overlay during transition */}
      {(isAnimating || isTransitioning) && (
        <div className="absolute inset-0 bg-green-600/20 backdrop-blur-[1px] z-20 transition-opacity duration-200" />
      )}
    </div>
  );
};
