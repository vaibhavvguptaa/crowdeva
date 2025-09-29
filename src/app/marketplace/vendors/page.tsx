"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Grid, 
  List, 
  ChevronDown,
  Building2,
  Award,
  Search,
  CheckCircle,
  Filter
} from 'lucide-react';
import Header from '@/components/Ui/header';
import { withAuth } from '@/lib/auth';
import { marketplaceDataService as marketplaceService } from '@/lib/marketplaceData';
import { VendorProfile, MarketplaceFilters as IMarketplaceFilters } from '@/types/marketplace';
import { MarketplaceFilters } from '@/components/marketplace/MarketplaceFilters';
import { ProfileCard } from '@/components/marketplace/ProfileCard';
import { useDebounce } from '@/hooks/debounce';

const VendorsMarketplacePage: React.FC = () => {
  const router = useRouter();
  const [vendors, setVendors] = useState<VendorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'relevance' | 'rating' | 'rate' | 'recent' | 'experience'>('relevance');
  
  const [filters, setFilters] = useState<Partial<IMarketplaceFilters>>({
    searchTerm: '',
    location: [],
    hourlyRateMin: 0,
    hourlyRateMax: 300,
    experience: [],
    rating: 0,
    verified: false,
    topRated: false,
    services: [],
    companySize: [],
    languages: []
  });

  const [filterOptions, setFilterOptions] = useState({
    skills: [] as string[],
    specializations: [] as string[],
    locations: [] as string[],
    services: [] as string[],
    industries: [] as string[],
    companySizes: [] as string[]
  });

  const [totalCount, setTotalCount] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  const debouncedSearchTerm = useDebounce(filters.searchTerm || '', 300);

  // Fetch filter options on component mount
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const options = await marketplaceService.getFilterOptions();
        setFilterOptions(options);
      } catch (error) {
        console.error('Error fetching filter options:', error);
      }
    };

    fetchFilterOptions();
  }, []);

  // Search vendors when filters change
  useEffect(() => {
    const searchVendors = async () => {
      try {
        setLoading(true);
        
        const searchFilters = {
          ...filters,
          searchTerm: debouncedSearchTerm
        };

        const result = await marketplaceService.searchVendors(searchFilters);
        
        // Apply sorting
        let sortedVendors = [...result.profiles] as VendorProfile[];
        switch (sortBy) {
          case 'rating':
            sortedVendors.sort((a, b) => b.rating - a.rating);
            break;
          case 'rate':
            sortedVendors.sort((a, b) => a.hourlyRate - b.hourlyRate);
            break;
          case 'experience':
            sortedVendors.sort((a, b) => b.experience - a.experience);
            break;
          case 'recent':
            sortedVendors.sort((a, b) => 
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
            break;
          default:
            break;
        }
        
        setVendors(sortedVendors);
        setTotalCount(result.totalCount);
        
      } catch (error) {
        console.error('Error searching vendors:', error);
      } finally {
        setLoading(false);
      }
    };

    searchVendors();
  }, [debouncedSearchTerm, filters, sortBy]);

  const handleFiltersChange = useCallback((newFilters: Partial<IMarketplaceFilters>) => {
    setFilters(newFilters);
  }, []);

  const handleSearchChange = useCallback((searchTerm: string) => {
    setFilters(prev => ({ ...prev, searchTerm }));
  }, []);

  const handleViewProfile = (id: string) => {
    router.push(`/marketplace/profile/${id}?type=vendor`);
  };

  const handleContact = (id: string) => {
    router.push(`/marketplace/contact/${id}`);
  };

  const getActiveFiltersCount = () => {
    return (filters.location?.length || 0) +
           ((filters.hourlyRateMin || 0) > 0 ? 1 : 0) +
           ((filters.hourlyRateMax || 300) < 300 ? 1 : 0) +
           (filters.experience?.length || 0) +
           ((filters.rating || 0) > 0 ? 1 : 0) +
           (filters.verified ? 1 : 0) +
           (filters.topRated ? 1 : 0) +
           (filters.services?.length || 0) +
           (filters.companySize?.length || 0);
  };

  const sortOptions = [
    { value: 'relevance', label: 'Most Relevant' },
    { value: 'rating', label: 'Highest Rated' },
    { value: 'experience', label: 'Most Experienced' },
    { value: 'rate', label: 'Lowest Rate' },
    { value: 'recent', label: 'Recently Joined' }
  ];

  const clearAllFilters = () => {
    setFilters({
      searchTerm: '',
      location: [],
      hourlyRateMin: 0,
      hourlyRateMax: 300,
      experience: [],
      rating: 0,
      verified: false,
      topRated: false,
      services: [],
      companySize: [],
      languages: []
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Breadcrumb & Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-green-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            Vendors Marketplace
          </h1>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={filters.searchTerm || ''}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search vendors by services, company name, or industry..."
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
        </div>

        <div className="flex gap-6">
          {/* Filters Sidebar - Hidden on mobile by default */}
          <div className={`lg:block ${showFilters ? 'block' : 'hidden'} w-80 flex-shrink-0`}>
            <div className="sticky top-6">
              <MarketplaceFilters
                filters={filters}
                onFiltersChange={handleFiltersChange}
                onClose={() => setShowFilters(false)}
                profileType="vendor"
                filterOptions={filterOptions}
              />
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Results Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 bg-white rounded-lg border border-gray-200 p-4">
              <div className="text-sm text-gray-600">
                {loading ? (
                  'Searching...'
                ) : (
                  <>
                    <span className="font-medium text-gray-900">{totalCount}</span> vendors found
                    {getActiveFiltersCount() > 0 && (
                      <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                        {getActiveFiltersCount()} filter{getActiveFiltersCount() > 1 ? 's' : ''} applied
                      </span>
                    )}
                  </>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Mobile Filter Button */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Filter className="w-4 h-4" />
                  Filters
                  {getActiveFiltersCount() > 0 && (
                    <span className="bg-green-100 text-green-800 text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {getActiveFiltersCount()}
                    </span>
                  )}
                </button>

                {/* Sort Dropdown */}
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="appearance-none bg-white border border-gray-300 rounded-md px-3 py-2 pr-8 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    {sortOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>

                {/* View Mode Toggle */}
                <div className="flex border border-gray-300 rounded-md overflow-hidden">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 ${viewMode === 'grid' ? 'bg-green-50 text-green-600' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 border-l border-gray-300 ${viewMode === 'list' ? 'bg-green-50 text-green-600' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Filter Chips */}
            <div className="flex flex-wrap gap-2 mb-6">
              <button
                onClick={() => handleFiltersChange({ ...filters, topRated: !filters.topRated })}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  filters.topRated 
                    ? 'bg-green-100 text-green-700 border border-green-300' 
                    : 'bg-white text-gray-600 border border-gray-300 hover:border-gray-400'
                }`}
              >
                <Award className="w-4 h-4 inline mr-1" />
                Top Rated
              </button>
              
              <button
                onClick={() => handleFiltersChange({ ...filters, verified: !filters.verified })}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  filters.verified 
                    ? 'bg-green-100 text-green-700 border border-green-300' 
                    : 'bg-white text-gray-600 border border-gray-300 hover:border-gray-400'
                }`}
              >
                <CheckCircle className="w-4 h-4 inline mr-1" />
                Verified
              </button>

              {filterOptions.services.slice(0, 3).map(service => (
                <button
                  key={service}
                  onClick={() => {
                    const serviceFilter = filters.services?.includes(service)
                      ? filters.services.filter(s => s !== service)
                      : [...(filters.services || []), service];
                    handleFiltersChange({ ...filters, services: serviceFilter });
                  }}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    filters.services?.includes(service)
                      ? 'bg-green-100 text-green-700 border border-green-300' 
                      : 'bg-white text-gray-600 border border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {service}
                </button>
              ))}
              
              {getActiveFiltersCount() > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="px-3 py-1.5 rounded-full text-sm font-medium text-gray-600 border border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                >
                  Clear All
                </button>
              )}
            </div>

            {/* Loading State */}
            {loading && (
              <div className="space-y-6">
                {[...Array(4)].map((_, index) => (
                  <div key={index} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
                      <div className="flex-1 space-y-3">
                        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                        <div className="flex gap-2">
                          <div className="h-6 bg-gray-200 rounded w-20"></div>
                          <div className="h-6 bg-gray-200 rounded w-24"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Results Grid/List */}
            {!loading && vendors.length > 0 && (
              <div className={viewMode === 'grid' ? 'grid lg:grid-cols-2 gap-6' : 'space-y-4'}>
                {vendors.map((vendor) => (
                  <ProfileCard
                    key={vendor.id}
                    profile={vendor}
                    onViewProfile={handleViewProfile}
                    onContact={handleContact}
                    className={viewMode === 'list' ? 'grid grid-cols-1' : ''}
                  />
                ))}
              </div>
            )}

            {/* Empty State */}
            {!loading && vendors.length === 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Building2 className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No vendors found</h3>
                <p className="text-gray-600 mb-6">
                  Try adjusting your search criteria or filters to find more vendors.
                </p>
                <button
                  onClick={clearAllFilters}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default withAuth(VendorsMarketplacePage, ['customers', 'developers', 'vendors']);