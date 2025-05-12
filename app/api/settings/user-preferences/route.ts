import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse } from '../../lib/api-response';
import { handleApiError } from '../../lib/error-handler';

// In a real app, this would be stored in a database per user
const userPreferences = {
  theme: 'light',
  defaultCurrency: 'CAD',
  itemsPerPage: 10,
  dashboardLayout: 'default',
  notifications: {
    email: true,
    browser: true
  }
};

/**
 * GET /api/settings/user-preferences
 * Get user preferences
 */
export async function GET(request: NextRequest) {
  try {
    // In a real app, we would get the user ID from the session
    // and fetch preferences for that specific user
    
    return NextResponse.json(createSuccessResponse(userPreferences));
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PATCH /api/settings/user-preferences
 * Update user preferences
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Deep merge the preferences
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
    
    deepMerge(userPreferences, body);
    
    return NextResponse.json(createSuccessResponse(userPreferences));
  } catch (error) {
    return handleApiError(error);
  }
}