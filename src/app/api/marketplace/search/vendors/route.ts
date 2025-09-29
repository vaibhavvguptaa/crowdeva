import { NextResponse } from 'next/server';
import { marketplaceService } from '@/services/marketplaceService';

// GET /api/marketplace/search/vendors
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extract filters from query parameters
    const filters: any = {};
    
    if (searchParams.get('searchTerm')) {
      filters.searchTerm = searchParams.get('searchTerm');
    }
    
    if (searchParams.get('location')) {
      filters.location = searchParams.get('location');
    }
    
    if (searchParams.get('hourlyRateMin')) {
      filters.hourlyRateMin = parseFloat(searchParams.get('hourlyRateMin') || '0');
    }
    
    if (searchParams.get('hourlyRateMax')) {
      filters.hourlyRateMax = parseFloat(searchParams.get('hourlyRateMax') || '0');
    }
    
    if (searchParams.get('companySize')) {
      filters.companySize = searchParams.get('companySize');
    }
    
    if (searchParams.get('rating')) {
      filters.rating = parseFloat(searchParams.get('rating') || '0');
    }
    
    if (searchParams.get('verified')) {
      filters.verified = searchParams.get('verified') === 'true';
    }
    
    if (searchParams.get('topRated')) {
      filters.topRated = searchParams.get('topRated') === 'true';
    }
    
    // Pagination
    if (searchParams.get('page')) {
      filters.page = parseInt(searchParams.get('page') || '1');
    }
    
    if (searchParams.get('limit')) {
      filters.limit = parseInt(searchParams.get('limit') || '10');
    }
    
    const result = await marketplaceService.searchVendors(filters);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error searching vendors:', error);
    return NextResponse.json(
      { error: 'Failed to search vendors' },
      { status: 500 }
    );
  }
}