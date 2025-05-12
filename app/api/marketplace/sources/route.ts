import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse } from '../../lib/api-response';
import { handleApiError } from '../../lib/error-handler';

// Mock data for marketplace sources
const marketplaceSources = [
  {
    id: '1',
    name: 'Marketplace 1',
    url: 'https://marketplace1.example.com',
    active: true,
    updateFrequency: 'daily',
    lastUpdated: '2025-04-10T14:30:00Z'
  },
  {
    id: '2',
    name: 'Marketplace 2',
    url: 'https://marketplace2.example.com',
    active: true,
    updateFrequency: 'weekly',
    lastUpdated: '2025-04-08T10:15:00Z'
  },
  {
    id: '3',
    name: 'Marketplace 3',
    url: 'https://marketplace3.example.com',
    active: true,
    updateFrequency: 'daily',
    lastUpdated: '2025-04-10T16:45:00Z'
  }
];

/**
 * GET /api/marketplace/sources
 * Get available marketplace sources
 */
export async function GET(request: NextRequest) {
  try {
    return NextResponse.json(createSuccessResponse(marketplaceSources));
  } catch (error) {
    return handleApiError(error);
  }
}