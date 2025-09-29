"use client";

import React, { useState } from 'react';
import { Search, SlidersHorizontal, Grid, List, ChevronDown } from 'lucide-react';
import { MarketplaceSearchBar } from './MarketplaceSearchBar';

export type ViewMode = 'grid' | 'list';
export type SortOption = 'best-match' | 'hourly-rate-low' | 'hourly-rate-high' | 'most-experienced' | 'highest-rated' | 'most-recent';
export type TabType = 'all' | 'developers' | 'vendors' | 'teams';

interface MarketplaceHeaderProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  showFilters: boolean;
  onFilterToggle: () => void;
  totalResults: number;
  isLoading?: boolean;
  className?: string;
}

export const MarketplaceHeader: React.FC<MarketplaceHeaderProps> = ({
  searchTerm,
  onSearchChange,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  activeTab,
  onTabChange,
  showFilters,
  onFilterToggle,
  totalResults,
  isLoading = false,
  className = ""
}) => {
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'best-match', label: 'Best Match' },
    { value: 'hourly-rate-low', label: 'Hourly Rate: Low to High' },
    { value: 'hourly-rate-high', label: 'Hourly Rate: High to Low' },
    { value: 'most-experienced', label: 'Most Experienced' },
    { value: 'highest-rated', label: 'Highest Rated' },
    { value: 'most-recent', label: 'Most Recent' }
  ];

  const tabs: { value: TabType; label: string }[] = [
    { value: 'all', label: 'All Talent' },
    { value: 'developers', label: 'Developers' },
    { value: 'vendors', label: 'Vendors' },
    { value: 'teams', label: 'Teams' }
  ];

  const getCurrentSortLabel = () => {
    return sortOptions.find(option => option.value === sortBy)?.label || 'Best Match';
  };

  return (
    <div className={`bg-white border-b border-gray-200 ${className}`}>
      {/* Main Header */}
      <div className="px-6 py-4">
        <div className="flex flex-col gap-4">
          
          {/* Search Bar */}
          <div className="flex-1">
            <MarketplaceSearchBar
              searchTerm={searchTerm}
              onSearchChange={onSearchChange}
              onFilterToggle={onFilterToggle}
              showFilters={showFilters}
              placeholder="Search by skills, name, location, or keywords..."
              className="w-full"
            />
          </div>

          {/* Controls Row */}
          <div className="flex items-center justify-between gap-4">
            
            {/* Tabs */}
            <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
              {tabs.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => onTabChange(tab.value)}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === tab.value
                      ? 'bg-white text-green-700 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Results Count & Controls */}
            <div className="flex items-center gap-4">
              
              {/* Results Count */}
              <div className="text-sm text-gray-600">
                {isLoading ? (
                  <span>Searching...</span>
                ) : (
                  <span>
                    {totalResults.toLocaleString()} {totalResults === 1 ? 'result' : 'results'}
                  </span>
                )}
              </div>

              {/* Sort Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowSortDropdown(!showSortDropdown)}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <span>Sort: {getCurrentSortLabel()}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showSortDropdown ? 'rotate-180' : ''}`} />
                </button>

                {showSortDropdown && (
                  <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    <div className="py-1">
                      {sortOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => {
                            onSortChange(option.value);
                            setShowSortDropdown(false);
                          }}
                          className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                            sortBy === option.value
                              ? 'bg-green-50 text-green-700'
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center border border-gray-300 rounded-md">
                <button
                  onClick={() => onViewModeChange('grid')}
                  className={`p-2 transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-green-600 text-white'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                  }`}
                  title="Grid view"
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onViewModeChange('list')}
                  className={`p-2 transition-colors ${
                    viewMode === 'list'
                      ? 'bg-green-600 text-white'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                  }`}
                  title="List view"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              {/* Filter Toggle (Mobile) */}
              <button
                onClick={onFilterToggle}
                className={`md:hidden flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  showFilters
                    ? 'bg-green-100 text-green-700'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>Filters</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Click outside handler for sort dropdown */}
      {showSortDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowSortDropdown(false)}
        />
      )}
    </div>
  );
};