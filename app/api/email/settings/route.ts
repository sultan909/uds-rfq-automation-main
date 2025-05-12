import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse } from '../../lib/api-response';
import { handleApiError } from '../../lib/error-handler';

// Mock email parsing settings
const emailSettings = {
  enabled: true,
  checkInterval: 5, // minutes
  emailAccounts: [
    {
      id: '1',
      email: 'rfq@example.com',
      protocol: 'IMAP',
      server: 'imap.example.com',
      port: 993,
      ssl: true,
      username: 'rfq@example.com',
      folders: ['INBOX', 'RFQs']
    }
  ],
  rules: [
    {
      id: '1',
      name: 'Tech Solutions Emails',
      condition: 'from:techsolutions.com',
      action: 'parse',
      prioritize: true
    },
    {
      id: '2',
      name: 'RFQ in Subject',
      condition: 'subject:RFQ',
      action: 'parse',
      prioritize: true
    },
    {
      id: '3',
      name: 'Quote Request',
      condition: 'subject:"quote request"',
      action: 'parse',
      prioritize: false
    }
  ],
  skuDetection: {
    enabled: true,
    autoMap: true,
    confidenceThreshold: 85
  },
  customerDetection: {
    enabled: true,
    autoAssign: true,
    confidenceThreshold: 80
  }
};

/**
 * GET /api/email/settings
 * Get email parsing settings
 */
export async function GET(request: NextRequest) {
  try {
    return NextResponse.json(createSuccessResponse(emailSettings));
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PATCH /api/email/settings
 * Update email parsing settings
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Update the settings
    // In a real application, we would validate the settings before updating
    
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
    
    deepMerge(emailSettings, body);
    
    return NextResponse.json(createSuccessResponse(emailSettings));
  } catch (error) {
    return handleApiError(error);
  }
}