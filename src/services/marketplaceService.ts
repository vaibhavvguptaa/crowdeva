// Server-side check
if (typeof window !== 'undefined') {
  throw new Error('This module can only be imported on the server side');
}

import { DeveloperProfile, VendorProfile, CustomerProfile, MarketplaceFilters, MarketplaceSearchResult } from '@/types/marketplace';

class MarketplaceService {
  async searchDevelopers(filters: Partial<MarketplaceFilters> = {}): Promise<MarketplaceSearchResult> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    try {
      // Dynamic import to ensure server-side only execution
      const { searchDevelopers } = await import('@/lib/db/marketplaceQueries');
      
      // Add pagination parameters
      const page = filters.page || 1;
      const limit = filters.limit || 10;
      const offset = (page - 1) * limit;
      
      const searchFilters = {
        ...filters,
        limit,
        offset
      };
      
      const developers = await searchDevelopers(searchFilters);
      
      // Get total count for pagination
      const { getDevelopersCount } = await import('@/lib/db/marketplaceQueries');
      const totalCount = await getDevelopersCount(filters);
      const totalPages = Math.ceil(totalCount / limit);
      
      return {
        profiles: developers,
        totalCount,
        currentPage: page,
        totalPages,
        filters: filters as MarketplaceFilters
      };
    } catch (error) {
      console.error('Error searching developers:', error);
      throw error;
    }
  }

  async searchVendors(filters: Partial<MarketplaceFilters> = {}): Promise<MarketplaceSearchResult> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    try {
      // Dynamic import to ensure server-side only execution
      const { searchVendors } = await import('@/lib/db/marketplaceQueries');
      
      // Add pagination parameters
      const page = filters.page || 1;
      const limit = filters.limit || 10;
      const offset = (page - 1) * limit;
      
      const searchFilters = {
        ...filters,
        limit,
        offset
      };
      
      const vendors = await searchVendors(searchFilters);
      
      // Get total count for pagination
      const { getVendorsCount } = await import('@/lib/db/marketplaceQueries');
      const totalCount = await getVendorsCount(filters);
      const totalPages = Math.ceil(totalCount / limit);
      
      return {
        profiles: vendors,
        totalCount,
        currentPage: page,
        totalPages,
        filters: filters as MarketplaceFilters
      };
    } catch (error) {
      console.error('Error searching vendors:', error);
      throw error;
    }
  }

  async getProfile(id: string): Promise<DeveloperProfile | VendorProfile | CustomerProfile | null> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    try {
      // Dynamic import to ensure server-side only execution
      const { getDeveloperById, getVendorById, getCustomerById } = await import('@/lib/db/marketplaceQueries');
      
      // Try to get developer first
      const developer = await getDeveloperById(id);
      if (developer) return developer;
      
      // Try to get vendor
      const vendor = await getVendorById(id);
      if (vendor) return vendor;
      
      // Try to get customer
      const customer = await getCustomerById(id);
      if (customer) return customer;
      
      return null;
    } catch (error) {
      console.error('Error fetching profile:', error);
      throw error;
    }
  }

  async getDevelopers(): Promise<DeveloperProfile[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    try {
      // Dynamic import to ensure server-side only execution
      const { getDevelopers } = await import('@/lib/db/marketplaceQueries');
      return await getDevelopers();
    } catch (error) {
      console.error('Error fetching developers:', error);
      throw error;
    }
  }

  async getVendors(): Promise<VendorProfile[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    try {
      // Dynamic import to ensure server-side only execution
      const { getVendors } = await import('@/lib/db/marketplaceQueries');
      return await getVendors();
    } catch (error) {
      console.error('Error fetching vendors:', error);
      throw error;
    }
  }

  async getCustomers(): Promise<CustomerProfile[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    try {
      // Dynamic import to ensure server-side only execution
      const { getCustomers } = await import('@/lib/db/marketplaceQueries');
      return await getCustomers();
    } catch (error) {
      console.error('Error fetching customers:', error);
      throw error;
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
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    try {
      // Dynamic import to ensure server-side only execution
      const { getDistinctSkills, getDistinctSpecializations, getDistinctLocations, getDistinctServices, getDistinctIndustries } = await import('@/lib/db/marketplaceQueries');
      
      // Get filter options from database queries
      const skills = await getDistinctSkills();
      const specializations = await getDistinctSpecializations();
      const locations = await getDistinctLocations();
      const services = await getDistinctServices();
      const industries = await getDistinctIndustries();
      
      return {
        skills,
        specializations,
        locations,
        services,
        industries,
        companySizes: ['1-10', '11-50', '51-200', '200+']
      };
    } catch (error) {
      console.error('Error fetching filter options:', error);
      // Fallback to default options if database query fails
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

export const marketplaceService = new MarketplaceService();