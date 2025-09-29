"use client";

import { useEffect, useCallback } from 'react';
import { AuthUserType, REALM_CONFIGS } from '@/types/auth';

/**
 * Hook to preload content and prevent layout shifts during tab transitions
 */
export const useContentPreloader = () => {
  const preloadContent = useCallback(() => {
    // Preload all tab content by creating hidden elements
    // This ensures smooth transitions without content loading delays
    const preloadContainer = document.createElement('div');
    preloadContainer.style.cssText = `
      position: absolute;
      visibility: hidden;
      pointer-events: none;
      top: -9999px;
      left: -9999px;
      width: 1px;
      height: 1px;
      overflow: hidden;
    `;
    
    Object.keys(REALM_CONFIGS).forEach((tabKey) => {
      const tab = tabKey as AuthUserType;
      const config = REALM_CONFIGS[tab];
      
      // Create content elements to trigger any necessary preloading
      const contentDiv = document.createElement('div');
      contentDiv.innerHTML = `
        <h2>${config.displayName.replace('For ', '')} Platform</h2>
        <p>${config.description}</p>
        ${config.features.map(feature => `<span>${feature}</span>`).join('')}
      `;
      preloadContainer.appendChild(contentDiv);
    });
    
    document.body.appendChild(preloadContainer);
    
    // Clean up after a short delay
    setTimeout(() => {
      document.body.removeChild(preloadContainer);
    }, 100);
  }, []);

  useEffect(() => {
    // Preload content after component mount
    const timer = setTimeout(preloadContent, 100);
    return () => clearTimeout(timer);
  }, [preloadContent]);

  return { preloadContent };
};

/**
 * Hook to optimize tab switching performance
 */
export const useOptimizedTabSwitching = (
  activeTab: AuthUserType,
  onTabChange: (tab: AuthUserType) => void
) => {
  // Optimize tab switching with requestAnimationFrame
  const optimizedTabChange = useCallback((newTab: AuthUserType) => {
    if (newTab === activeTab) return;
    
    requestAnimationFrame(() => {
      onTabChange(newTab);
    });
  }, [activeTab, onTabChange]);

  return { optimizedTabChange };
};
