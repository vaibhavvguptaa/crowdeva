import { NextResponse } from 'next/server';
import { marketplaceService } from '@/services/marketplaceService';

// GET /api/marketplace/filters
export async function GET() {
  try {
    const filterOptions = await marketplaceService.getFilterOptions();
    
    return NextResponse.json(filterOptions);
  } catch (error) {
    console.error('Error fetching filter options:', error);
    return NextResponse.json(
      { error: 'Failed to fetch filter options' },
      { status: 500 }
    );
  }
}