"use client";

import React, { useState } from 'react';
import { Search, X, Filter } from 'lucide-react';

interface MarketplaceSearchBarProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onFilterToggle: () => void;
  showFilters: boolean;
  placeholder?: string;
  className?: string;
}

export const MarketplaceSearchBar: React.FC<MarketplaceSearchBarProps> = ({
  searchTerm,
  onSearchChange,
  onFilterToggle,
  showFilters,
  placeholder = "Search by skills, name, or keywords...",
  className = ""
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleClear = () => {
    onSearchChange('');
  };

  return (
    <div className={`relative ${className}`}>
      <div className={`relative flex items-center bg-white border rounded-lg transition-all duration-200 ${
        isFocused ? 'border-green-500 ring-2 ring-green-100' : 'border-gray-300 hover:border-gray-400'
      }`}>
        <div className="flex items-center pl-4">
          <Search className="w-5 h-5 text-gray-400" />
        </div>
        
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className="flex-1 px-4 py-3 text-gray-900 placeholder-gray-900 bg-transparent border-0 outline-none focus:ring-0"
        />
        
        {searchTerm && (
          <button
            onClick={handleClear}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        
        <div className="flex items-center pr-2">
          <button
            onClick={onFilterToggle}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              showFilters 
                ? 'bg-green-100 text-green-700' 
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
            }`}
            aria-label="Toggle filters"
          >
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">Filters</span>
          </button>
        </div>
      </div>
      
      {searchTerm && (
        <div className="absolute top-full left-0 right-0 mt-1 p-2 bg-white border border-gray-200 rounded-lg shadow-sm z-10">
          <div className="text-xs text-gray-500">
            Searching for: <span className="font-medium text-gray-700">"{searchTerm}"</span>
          </div>
        </div>
      )}
    </div>
  );
};