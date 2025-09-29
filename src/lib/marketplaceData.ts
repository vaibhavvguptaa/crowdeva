// Marketplace data service using API calls instead of direct database queries
import { DeveloperProfile, VendorProfile, MarketplaceFilters, MarketplaceSearchResult } from '@/types/marketplace';

class MarketplaceDataService {
  // Simulate API delay
  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async searchDevelopers(filters: Partial<MarketplaceFilters> = {}): Promise<MarketplaceSearchResult> {
    try {
      // Use API call instead of importing service directly
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
      
      const response = await fetch(`/api/marketplace/search/developers?${params.toString()}`);
      if (response.ok) {
        return await response.json();
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error in marketplace data service:', error);
      // Fallback to empty result if API call fails
      return {
        profiles: [],
        totalCount: 0,
        currentPage: 1,
        totalPages: 0,
        filters: filters as MarketplaceFilters
      };
    }
  }

  async searchVendors(filters: Partial<MarketplaceFilters> = {}): Promise<MarketplaceSearchResult> {
    try {
      // Use API call instead of importing service directly
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
      
      const response = await fetch(`/api/marketplace/search/vendors?${params.toString()}`);
      if (response.ok) {
        return await response.json();
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error in marketplace data service:', error);
      // Fallback to empty result if API call fails
      return {
        profiles: [],
        totalCount: 0,
        currentPage: 1,
        totalPages: 0,
        filters: filters as MarketplaceFilters
      };
    }
  }

  async getProfile(id: string): Promise<DeveloperProfile | VendorProfile | null> {
    try {
      // Use API call instead of importing service directly
      const response = await fetch(`/api/marketplace/profiles/${id}`);
      if (response.ok) {
        const profile = await response.json();
        // Only return DeveloperProfile or VendorProfile, not CustomerProfile
        if (profile && ('type' in profile) && (profile.type === 'developer' || profile.type === 'vendor')) {
          return profile as DeveloperProfile | VendorProfile;
        }
        return null;
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error in marketplace data service:', error);
      return null;
    }
  }

  // Get available filter options
  async getFilterOptions(): Promise<{
    skills: string[];
    specializations: string[];
    locations: string[];
    services: string[];
    industries: string[];
    companySizes: string[];
  }> {
    try {
      // Use API call instead of importing service directly
      const response = await fetch('/api/marketplace/filters/options');
      if (response.ok) {
        return await response.json();
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error in marketplace data service:', error);
      // Fallback to default options if API call fails
      return {
        skills: [],
        specializations: [],
        locations: [],
        services: [],
        industries: [],
        companySizes: ['1-10', '11-50', '51-200', '200+']
      };
    }
  }
}

export const marketplaceDataService = new MarketplaceDataService();