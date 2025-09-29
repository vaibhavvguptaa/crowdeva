"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback, useLayoutEffect } from 'react';
import { AuthUserType, REALM_CONFIGS } from '@/types/auth';
import { useHydrationSafe } from '@/hooks/useHydrationSafe';

interface TabSwitcherProps {
  activeTab: AuthUserType;
  onTabChange: (tab: AuthUserType) => void;
  className?: string;
  includeVendors?: boolean;
  disabled?: boolean;
}

export const TabSwitcher: React.FC<TabSwitcherProps> = ({
  activeTab,
  onTabChange,
  className = '',
  includeVendors = false,
  disabled = false,
}) => {
  const hasMounted = useHydrationSafe();
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [indicatorStyle, setIndicatorStyle] = useState<{ left: number; width: number }>({ left: 0, width: 0 });
  const tabButtonRefs = useRef<HTMLButtonElement[]>([]);

  // Remove leading 'For ' (case-insensitive) from display names for UI display only
  const clean = (label: string) => label.replace(/^for\s+/i, '').trim();
  // Memoize tabs so reference stays stable across renders unless includeVendors changes
  const tabs: { id: AuthUserType; label: string }[] = useMemo(() => (
    includeVendors
      ? [
          { id: 'customers', label: clean(REALM_CONFIGS.customers.displayName) },
          { id: 'vendors', label: clean(REALM_CONFIGS.vendors.displayName) },
          { id: 'developers', label: clean(REALM_CONFIGS.developers.displayName) },
        ]
      : [
          { id: 'customers', label: clean(REALM_CONFIGS.customers.displayName) },
          { id: 'developers', label: clean(REALM_CONFIGS.developers.displayName) },
        ]
  ), [includeVendors]);

  // Update active tab index when activeTab changes
  useEffect(() => {
    const newIndex = tabs.findIndex(tab => tab.id === activeTab);
    if (newIndex !== -1) setActiveTabIndex(newIndex);
  }, [activeTab, tabs]);

  const activateTab = useCallback(async (tab: AuthUserType, index: number) => {
    if (tab === activeTab || disabled || isTransitioning) return;
    
    setIsTransitioning(true);
    setActiveTabIndex(index);
    
    // Small delay for visual feedback
    await new Promise(resolve => setTimeout(resolve, 100));
    
    onTabChange(tab);
    
    setTimeout(() => setIsTransitioning(false), 200);
  }, [activeTab, disabled, isTransitioning, onTabChange]);

  const handleTabClick = (tab: AuthUserType, index: number) => {
    void activateTab(tab, index);
  };

  // Update indicator position/size to match active tab's actual text width
  const recomputeIndicator = useCallback(() => {
    const btn = tabButtonRefs.current[activeTabIndex];
    if (btn && btn.parentElement) {
      const containerRect = btn.parentElement.getBoundingClientRect();
      const btnRect = btn.getBoundingClientRect();
      setIndicatorStyle({
        left: btnRect.left - containerRect.left + btn.parentElement.scrollLeft,
        width: btnRect.width,
      });
    }
  }, [activeTabIndex]);

  // Recalculate whenever active tab changes, tabs list changes, or on resize
  useLayoutEffect(() => {
    if (!hasMounted) return; // wait for hydration
    recomputeIndicator();
  }, [hasMounted, recomputeIndicator, tabs]);

  useEffect(() => {
    if (!hasMounted) return;
    const handleResize = () => {
      recomputeIndicator();
    };
    window.addEventListener('resize', handleResize);
    // Font loading can change width; attempt another recompute after short delay
    const t = setTimeout(recomputeIndicator, 150);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(t);
    };
  }, [hasMounted, recomputeIndicator]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    const key = e.key;
    if (!['ArrowRight','ArrowLeft','Home','End'].includes(key)) return;
    e.preventDefault();
    let newIndex = activeTabIndex;
    if (key === 'ArrowRight') {
      newIndex = (activeTabIndex + 1) % tabs.length;
    } else if (key === 'ArrowLeft') {
      newIndex = (activeTabIndex - 1 + tabs.length) % tabs.length;
    } else if (key === 'Home') {
      newIndex = 0;
    } else if (key === 'End') {
      newIndex = tabs.length - 1;
    }
    const targetTab = tabs[newIndex];
    tabButtonRefs.current[newIndex]?.focus();
    void activateTab(targetTab.id, newIndex);
  };

  return (
    <div
      className={`relative flex items-center gap-1 rounded-xl w-full max-w-md bg-gray-100/80 backdrop-blur-sm p-1.5 ${className}`}
      role="tablist"
      aria-orientation="horizontal"
      onKeyDown={onKeyDown}
    >
      {/* Animated background indicator - only show after hydration */}
      {hasMounted && (
        <div
          className="absolute top-1.5 bottom-1.5 bg-white shadow-md rounded-lg transition-all duration-300 ease-in-out"
          style={{
            left: indicatorStyle.left,
            width: indicatorStyle.width,
            transform: isTransitioning ? 'scale(0.98)' : 'scale(1)',
          }}
        />
      )}
      
      {tabs.map((tab, index) => (
  <button
          key={tab.id}
          id={`tab-${tab.id}`}
          ref={(el) => { if (el) tabButtonRefs.current[index] = el; }}
          type="button"
          role="tab"
          tabIndex={activeTabIndex === index ? 0 : -1}
          aria-selected={activeTab === tab.id}
          aria-controls={`${tab.id}-tabpanel`}
          onClick={() => handleTabClick(tab.id, index)}
          disabled={disabled || isTransitioning}
          className={`relative flex-shrink-0 py-2 lg:py-3 px-3 lg:px-5 rounded-lg text-xs lg:text-sm font-semibold transition-all duration-300 whitespace-nowrap z-10 ${
            activeTab === tab.id
              ? 'text-gray-900'
              : 'text-gray-600 hover:text-gray-900'
          } ${
            disabled || isTransitioning 
              ? 'cursor-not-allowed opacity-50' 
              : activeTab === tab.id 
                ? 'cursor-default' 
                : 'cursor-pointer hover:scale-105'
          }`}
        >
          <span 
            className={`hidden sm:inline transition-all duration-200 ${
              hasMounted && isTransitioning && activeTab === tab.id ? 'animate-pulse' : ''
            }`}
          >
            {tab.label}
          </span>
          <span 
            className={`sm:hidden transition-all duration-200 ${
              hasMounted && isTransitioning && activeTab === tab.id ? 'animate-pulse' : ''
            }`}
          >
            {tab.id === 'customers' ? 'Customer' : 
             tab.id === 'vendors' ? 'Vendor' : 'Developer'}
          </span>
        </button>
      ))}
    </div>
  );
};
