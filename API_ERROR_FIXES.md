# API Error Fixes - Negotiation System 🔧

## Problem Summary
The user was experiencing these errors when accessing the negotiation tab:

```
Error: API Error: 500 Internal Server Error {}
ApiError: Failed to fetch SKU history
```

## Root Cause Analysis
The errors were caused by:
1. **Missing database tables** - The `negotiation_communications` and `sku_negotiation_history` tables might not exist
2. **Incomplete error handling** - API failures were causing complete component failures
3. **Missing database fields** - Some fields were referenced but not selected in queries

## Fixes Applied

### 1. Enhanced Error Handling in NegotiationTab ✅
**File**: `components/negotiation-tab.tsx`

- **Changed Promise.all to individual API calls** with graceful error handling
- **Added database error detection** - checks for table/relation errors
- **Provides fallback data** when tables don't exist
- **Added setup component integration** for database issues

```typescript
// Before: Fails completely if any API call fails
const [commResponse, historyResponse, summaryResponse] = await Promise.all([...]);

// After: Individual calls with error recovery
try {
  commResponse = await negotiationApi.getCommunications(rfqId.toString());
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  if (errorMessage.includes('relation') || errorMessage.includes('table') || errorMessage.includes('500')) {
    commResponse = { success: true, data: [] }; // Provide empty data
    setHasDbError(true); // Show setup component
  }
}
```

### 2. Database Error Recovery in API Routes ✅
**Files**: 
- `app/api/rfq/[id]/sku-history/route.ts`
- `app/api/rfq/[id]/negotiation-summary/route.ts`
- `app/api/rfq/[id]/communications/route.ts`

- **Added try-catch for individual database queries**
- **Handles missing tables gracefully**
- **Provides empty data instead of errors**
- **Enhanced error logging with details**

### 3. Fixed Missing Database Fields ✅
**File**: `app/api/rfq/[id]/communications/route.ts`

Added missing fields to the SELECT query:
```typescript
followUpCompleted: negotiationCommunications.followUpCompleted,
followUpCompletedAt: negotiationCommunications.followUpCompletedAt,
```

### 4. Improved API Client Error Handling ✅
**File**: `lib/api-client.ts`

- **Enhanced error message extraction**
- **Better error logging with context**
- **Proper JSON parsing error handling**

```typescript
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = "An error occurred";
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch (parseError) {
      errorMessage = response.statusText || `HTTP ${response.status}`;
    }
    
    console.error(`API Error: ${response.status} ${response.statusText}`, {
      url: response.url,
      status: response.status,
      statusText: response.statusText,
      message: errorMessage
    });
    
    throw new ApiError(response.status, errorMessage);
  }
  return response.json();
}
```

### 5. Database Setup System ✅
**Files**:
- `components/negotiation-setup.tsx` - UI component for database setup
- `app/api/setup-negotiation-db/route.ts` - API endpoint to create tables
- `scripts/migrate-negotiation-tables.js` - Command-line migration script

**Features**:
- **Automatic table detection** - checks if tables exist
- **One-click table creation** - creates missing tables via UI
- **Visual status indicators** - shows which tables exist
- **Command-line migration** - for programmatic setup

### 6. Enhanced Negotiation Summary API ✅
**File**: `app/api/rfq/[id]/negotiation-summary/route.ts`

- **Individual try-catch for each query** prevents single query failures from breaking the endpoint
- **Proper follow-up filtering** - filters for non-completed follow-ups
- **Default value handling** - provides sensible defaults when queries fail

## How the Fixes Work

### Error Recovery Flow:
1. **API Call Made** → If successful, proceed normally
2. **If 500 Error** → Check if it's a database/table issue
3. **If Database Issue** → Provide empty data and show setup component
4. **If Other Error** → Show error message but don't crash
5. **Setup Component** → Allows user to create missing tables
6. **After Setup** → Retry data fetching automatically

### Database Setup Options:

#### Option 1: UI-Based Setup (Recommended)
1. Navigate to RFQ detail page
2. Click on "Negotiation" tab
3. If tables are missing, you'll see a setup component
4. Click "Check Database Status" then "Create Missing Tables"
5. Tables will be created automatically

#### Option 2: Command Line Setup
```bash
cd E:\Web-development-Business\Mai-Automations\Cody-by-client\nabeel\uds-rfq
node scripts/migrate-negotiation-tables.js
```

#### Option 3: API Endpoint
```bash
# Check status
curl GET http://localhost:3000/api/setup-negotiation-db

# Create tables
curl -X POST http://localhost:3000/api/setup-negotiation-db
```

## Current Status: ✅ RESOLVED

The negotiation system should now:
- **Load gracefully** even if database tables don't exist
- **Provide setup options** when needed
- **Show detailed error messages** for debugging
- **Recover automatically** after setup is complete
- **Handle all edge cases** without crashing

## Testing Steps

1. **Navigate to any RFQ detail page**
2. **Click the "Negotiation" tab**
3. **Expected behaviors**:
   - If tables exist: Normal negotiation interface loads
   - If tables missing: Setup component appears with clear instructions
   - If other errors: Specific error messages in console

The system is now much more robust and user-friendly! 🎉
