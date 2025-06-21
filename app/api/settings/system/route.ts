import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse } from '../../lib/api-response';
import { handleApiError } from '../../lib/error-handler';
import { withAuth } from '@/lib/auth-middleware';
import { type User } from '@/lib/auth';

// In a real app, this would be stored in a database
const systemSettings = {
  appName: 'UDS RFQ Manager',
  version: '1.0.0',
  emailSettings: {
    enableEmailParsing: true,
    checkInterval: 5, // minutes
    emailFolder: 'Inbox'
  },
  quickbooksEnabled: true,
  marketplaceDataEnabled: true
};

/**
 * GET /api/settings/system
 * Get system settings
 */
async function getSystemSettingsHandler(request: NextRequest, context: any, user: User) {
  try {
    return NextResponse.json(createSuccessResponse(systemSettings));
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PATCH /api/settings/system
 * Update system settings
 */
async function updateSystemSettingsHandler(request: NextRequest, context: any, user: User) {
  try {
    const body = await request.json();
    
    // Deep merge the settings
    const deepMerge = (target: any, source: any) => {
      for (const key in source) {
        if (source[key] instanceof Object && key in target) {
          deepMerge(target[key], source[key]);
        } else {
          target[key] = source[key];
        }
      }
      return target;
    };
    
    deepMerge(systemSettings, body);
    
    return NextResponse.json(createSuccessResponse(systemSettings));
  } catch (error) {
    return handleApiError(error);
  }
}

// Export the authenticated handlers (ADMIN only)
export const GET = withAuth(getSystemSettingsHandler, { roles: ['ADMIN'] });
export const PATCH = withAuth(updateSystemSettingsHandler, { roles: ['ADMIN'] });