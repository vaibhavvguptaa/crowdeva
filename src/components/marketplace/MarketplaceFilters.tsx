"use client";

import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, MapPin, DollarSign, Clock, Star, Award, Users, GraduationCap, Building, User } from 'lucide-react';
import { MarketplaceFilters as IMarketplaceFilters } from '@/types/marketplace';

interface MarketplaceFiltersProps {
  filters: Partial<IMarketplaceFilters>;
  onFiltersChange: (filters: Partial<IMarketplaceFilters>) => void;
  onClose: () => void;
  profileType: 'developer' | 'vendor';
  filterOptions: {
    skills: string[];
    specializations: string[];
    locations: string[];
    services: string[];
    industries: string[];
    companySizes: string[];
  };
}

export const MarketplaceFilters: React.FC<MarketplaceFiltersProps> = ({
  filters,
  onFiltersChange,
  onClose,
  profileType,
  filterOptions
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['location', 'rate', 'experience', 'rating'])
  );

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const updateFilter = (key: keyof IMarketplaceFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const toggleArrayFilter = (key: keyof IMarketplaceFilters, value: string) => {
    const currentArray = (filters[key] as string[]) || [];
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value];
    updateFilter(key, newArray);
  };

  const clearAllFilters = () => {
    onFiltersChange({
      searchTerm: filters.searchTerm || '',
      location: [],
      hourlyRateMin: 0,
      hourlyRateMax: profileType === 'vendor' ? 300 : 200,
      experience: [],
      rating: 0,
      // Removed availability filter
      verified: false,
      topRated: false,
      skills: [],
      specializations: [],
      services: [],
      companySize: [],
      languages: [],
      education: [],
      profileTypeFilter: undefined
    });
  };

  const hasActiveFilters = () => {
    return (filters.location?.length || 0) > 0 ||
           (filters.hourlyRateMin || 0) > 0 ||
           (filters.hourlyRateMax || (profileType === 'vendor' ? 300 : 200)) < (profileType === 'vendor' ? 300 : 200) ||
           (filters.experience?.length || 0) > 0 ||
           (filters.rating || 0) > 0 ||
           // Removed availability filter check
           filters.verified ||
           filters.topRated ||
           (filters.skills?.length || 0) > 0 ||
           (filters.specializations?.length || 0) > 0 ||
           (filters.services?.length || 0) > 0 ||
           (filters.companySize?.length || 0) > 0 ||
           (filters.education?.length || 0) > 0 ||
           filters.profileTypeFilter;
  };

  const FilterSection: React.FC<{
    title: string;
    icon: React.ReactNode;
    sectionKey: string;
    children: React.ReactNode;
  }> = ({ title, icon, sectionKey, children }) => {
    const isExpanded = expandedSections.has(sectionKey);
    
    return (
      <div className="border-b border-gray-200 last:border-b-0">
        <button
          onClick={() => toggleSection(sectionKey)}
          className="flex items-center justify-between w-full py-4 px-0 text-left hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            {icon}
            <span className="font-medium text-gray-900">{title}</span>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          )}
        </button>
        
        {isExpanded && (
          <div className="pb-4 space-y-3">
            {children}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
          {hasActiveFilters() && (
            <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
              Active
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters() && (
            <button
              onClick={clearAllFilters}
              className="text-sm text-green-600 hover:text-green-700 font-medium"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Filter Content - Full length without scroll */}
      <div className="p-4 space-y-0">
        
        {/* Location Filter */}
        <FilterSection
          title="Location"
          icon={<MapPin className="w-4 h-4 text-gray-500" />}
          sectionKey="location"
        >
          <div className="space-y-2">
            {filterOptions.locations.map(location => (
              <label key={location} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={(filters.location || []).includes(location)}
                  onChange={() => toggleArrayFilter('location', location)}
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <span className="text-sm text-gray-700">{location}</span>
              </label>
            ))}
          </div>
        </FilterSection>

        {/* Hourly Rate Filter */}
        <FilterSection
          title="Hourly Rate"
          icon={<DollarSign className="w-4 h-4 text-gray-500" />}
          sectionKey="rate"
        >
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min Rate: ${filters.hourlyRateMin || 0}/hr
              </label>
              <input
                type="range"
                min="0"
                max={profileType === 'vendor' ? "300" : "200"}
                step="5"
                value={filters.hourlyRateMin || 0}
                onChange={(e) => updateFilter('hourlyRateMin', parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Rate: ${filters.hourlyRateMax || (profileType === 'vendor' ? 300 : 200)}/hr
              </label>
              <input
                type="range"
                min="0"
                max={profileType === 'vendor' ? "300" : "200"}
                step="5"
                value={filters.hourlyRateMax || (profileType === 'vendor' ? 300 : 200)}
                onChange={(e) => updateFilter('hourlyRateMax', parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>
          </div>
        </FilterSection>

        {/* Experience Filter */}
        <FilterSection
          title="Experience"
          icon={<Clock className="w-4 h-4 text-gray-500" />}
          sectionKey="experience"
        >
          <div className="space-y-2">
            {[
              { label: '1+ years', value: 1 },
              { label: '3+ years', value: 3 },
              { label: '5+ years', value: 5 },
              { label: '8+ years', value: 8 }
            ].map(exp => (
              <label key={exp.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={(filters.experience || []).includes(exp.value)}
                  onChange={() => toggleArrayFilter('experience', exp.value.toString())}
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <span className="text-sm text-gray-700">{exp.label}</span>
              </label>
            ))}
          </div>
        </FilterSection>

        {/* Rating Filter */}
        <FilterSection
          title="Rating"
          icon={<Star className="w-4 h-4 text-gray-500" />}
          sectionKey="rating"
        >
          <div className="space-y-2">
            {[4.5, 4.0, 3.5, 3.0].map(rating => (
              <label key={rating} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="rating"
                  checked={(filters.rating || 0) === rating}
                  onChange={() => updateFilter('rating', rating)}
                  className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
                />
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm text-gray-700">{rating}+ stars</span>
                </div>
              </label>
            ))}
          </div>
        </FilterSection>

        {/* Developer-specific filters */}
        {profileType === 'developer' && (
          <>
            <FilterSection
              title="Skills"
              icon={<Award className="w-4 h-4 text-gray-500" />}
              sectionKey="skills"
            >
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {filterOptions.skills.map(skill => (
                  <label key={skill} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(filters.skills || []).includes(skill)}
                      onChange={() => toggleArrayFilter('skills', skill)}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">{skill}</span>
                  </label>
                ))}
              </div>
            </FilterSection>

            <FilterSection
              title="Specializations"
              icon={<Award className="w-4 h-4 text-gray-500" />}
              sectionKey="specializations"
            >
              <div className="space-y-2">
                {filterOptions.specializations.map(spec => (
                  <label key={spec} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(filters.specializations || []).includes(spec)}
                      onChange={() => toggleArrayFilter('specializations', spec)}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">{spec}</span>
                  </label>
                ))}
              </div>
            </FilterSection>
          </>
        )}

        {/* Vendor-specific filters */}
        {profileType === 'vendor' && (
          <>
            <FilterSection
              title="Services"
              icon={<Award className="w-4 h-4 text-gray-500" />}
              sectionKey="services"
            >
              <div className="space-y-2">
                {filterOptions.services.map(service => (
                  <label key={service} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(filters.services || []).includes(service)}
                      onChange={() => toggleArrayFilter('services', service)}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">{service}</span>
                  </label>
                ))}
              </div>
            </FilterSection>

            <FilterSection
              title="Company Size"
              icon={<Users className="w-4 h-4 text-gray-500" />}
              sectionKey="companySize"
            >
              <div className="space-y-2">
                {filterOptions.companySizes.map(size => (
                  <label key={size} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(filters.companySize || []).includes(size)}
                      onChange={() => toggleArrayFilter('companySize', size)}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">{size} employees</span>
                  </label>
                ))}
              </div>
            </FilterSection>
          </>
        )}

        {/* Education Filter (for developers) */}
        {profileType === 'developer' && (
          <FilterSection
            title="Education"
            icon={<GraduationCap className="w-4 h-4 text-gray-500" />}
            sectionKey="education"
          >
            <div className="space-y-2">
              {[
                'Bachelors',
                'Masters', 
                'PhD',
                'Bootcamp',
                'Self-taught'
              ].map(education => (
                <label key={education} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={(filters.education || []).includes(education)}
                    onChange={() => toggleArrayFilter('education', education)}
                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-700">{education}</span>
                </label>
              ))}
            </div>
          </FilterSection>
        )}

        {/* Profile Type Toggle */}
        <FilterSection
          title="Profile Type"
          icon={<User className="w-4 h-4 text-gray-500" />}
          sectionKey="profileType"
        >
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="profileTypeFilter"
                value="individual"
                checked={filters.profileTypeFilter === 'individual'}
                onChange={() => updateFilter('profileTypeFilter', 'individual')}
                className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
              />
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-700">Individual Talent</span>
              </div>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="profileTypeFilter"
                value="vendor"
                checked={filters.profileTypeFilter === 'vendor'}
                onChange={() => updateFilter('profileTypeFilter', 'vendor')}
                className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
              />
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-700">Vendor Company</span>
              </div>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="profileTypeFilter"
                value="all"
                checked={!filters.profileTypeFilter || filters.profileTypeFilter === 'all'}
                onChange={() => updateFilter('profileTypeFilter', 'all')}
                className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
              />
              <span className="text-sm text-gray-700">Show All</span>
            </label>
          </div>
        </FilterSection>

        {/* Special Badges */}
        <FilterSection
          title="Special Badges"
          icon={<Award className="w-4 h-4 text-gray-500" />}
          sectionKey="badges"
        >
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.verified || false}
                onChange={(e) => updateFilter('verified', e.target.checked)}
                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
              <span className="text-sm text-gray-700">Verified</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.topRated || false}
                onChange={(e) => updateFilter('topRated', e.target.checked)}
                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
              <span className="text-sm text-gray-700">Top Rated</span>
            </label>
          </div>
        </FilterSection>

      </div>
    </div>
  );
};