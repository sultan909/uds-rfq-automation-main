import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse, createErrorResponse } from '../../../../lib/api-response';
import { handleApiError } from '../../../../lib/error-handler';

// Mock data for marketplace sources
const marketplaceSources = [
  {
    id: '1',
    name: 'Marketplace 1',
    url: 'https://marketplace1.example.com',
    active: true,
    updateFrequency: 'daily',
    lastUpdated: '2025-04-10T14:30:00Z',
    settings: {
      apiKey: 'mock-api-key-1',
      useProxy: false,
      timeout: 30000,
      retries: 3,
      categories: ['toner', 'ink', 'paper']
    }
  },
  {
    id: '2',
    name: 'Marketplace 2',
    url: 'https://marketplace2.example.com',
    active: true,
    updateFrequency: 'weekly',
    lastUpdated: '2025-04-08T10:15:00Z',
    settings: {
      apiKey: 'mock-api-key-2',
      useProxy: true,
      timeout: 15000,
      retries: 2,
      categories: ['toner', 'ink']
    }
  },
  {
    id: '3',
    name: 'Marketplace 3',
    url: 'https://marketplace3.example.com',
    active: true,
    updateFrequency: 'daily',
    lastUpdated: '2025-04-10T16:45:00Z',
    settings: {
      apiKey: 'mock-api-key-3',
      useProxy: false,
      timeout: 60000,
      retries: 5,
      categories: ['toner', 'ink', 'paper', 'printers']
    }
  }
];

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/marketplace/sources/:id/settings
 * Get marketplace source settings
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    
    // Find the marketplace source
    const source = marketplaceSources.find(s => s.id === id);
    
    if (!source) {
      return NextResponse.json(
        createErrorResponse(`Marketplace source with ID ${id} not found`),
        { status: 404 }
      );
    }
    
    return NextResponse.json(createSuccessResponse(source.settings));
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PATCH /api/marketplace/sources/:id/settings
 * Update marketplace source settings
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const body = await request.json();
    
    // Find the marketplace source
    const sourceIndex = marketplaceSources.findIndex(s => s.id === id);
    
    if (sourceIndex === -1) {
      return NextResponse.json(
        createErrorResponse(`Marketplace source with ID ${id} not found`),
        { status: 404 }
      );
    }
    
    // Update the settings
    marketplaceSources[sourceIndex].settings = {
      ...marketplaceSources[sourceIndex].settings,
      ...body
    };
    
    // Update the lastUpdated timestamp
    marketplaceSources[sourceIndex].lastUpdated = new Date().toISOString();
    
    return NextResponse.json(createSuccessResponse(marketplaceSources[sourceIndex].settings));
  } catch (error) {
    return handleApiError(error);
  }
}