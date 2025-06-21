# UDS RFQ Management System - Project Memory

## Project Overview
A comprehensive RFQ (Request for Quote) management system built with Next.js, TypeScript, and PrimeReact. The system handles quote requests, inventory management, customer relationships, and integrates with QuickBooks.

## Key Technologies
- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui components + PrimeReact for data tables
- **Database**: PostgreSQL with Drizzle ORM
- **State Management**: React Context (Currency)
- **Authentication**: Custom implementation
- **External Integration**: QuickBooks API

## Project Structure

### Core Directories
- `/app/` - Next.js App Router pages and API routes
- `/components/` - Reusable UI components
- `/components/rfq-tabs/` - RFQ detail page tab components
- `/lib/` - Utilities, types, and API client
- `/db/` - Database schema and configuration
- `/contexts/` - React contexts (currency management)

### Key Files
- `app/rfq-management/[id]/page.tsx` - Main RFQ detail page
- `components/rfq-tabs/` - Tab components for RFQ details
- `lib/api-client.ts` - Centralized API client
- `db/schema.ts` - Database schema definitions

## Architecture Patterns

### Tab System Architecture
The RFQ detail page uses a sophisticated tab system with:
- **Caching**: 5-minute cache for tab data to reduce API calls
- **Lazy Loading**: Data fetched only when tabs are accessed
- **Consistent Loading States**: All tabs use Loader2 from lucide-react
- **Data Sharing**: History tab reuses All tab data to avoid duplicate requests

### Loading State Pattern
```typescript
{loading && data.length === 0 ? (
  <div className="flex items-center justify-center py-8">
    <div className="flex items-center gap-2">
      <Loader2 className="h-4 w-4 animate-spin" />
      <div className="text-muted-foreground">Loading data...</div>
    </div>
  </div>
) : error ? (
  <div className="text-center py-8 text-red-500">{error}</div>
) : (
  // Content
)}
```

### Currency Management
- Global currency context with CAD/USD conversion
- Automatic currency conversion in all price displays
- Consistent formatting across all components

## Current Tab Structure

### Active Tabs
1. **ALL** - Comprehensive data view with PrimeReact DataTable
2. **Items** - Editable items with negotiation tracking
3. **Original Request** - Read-only view of initial request
4. **Pricing** - Pricing analysis and recommendations
5. **Inventory** - Stock levels and warehouse data
6. **History** - Sales history (uses All tab data)
7. **Market Data** - Market pricing and trends
8. **Quotation History** - Version tracking and responses
9. **Export** - Data export functionality

### Commented Out Tabs
- **Negotiation** - Currently disabled (commented out)
- **Settings** - Currently disabled (commented out)

## Important Implementation Details

### SKU Display Logic
The system prioritizes SKU display in this order:
1. `inventory?.sku` (internal SKU)
2. `customerSku` (customer's SKU)
3. 'N/A' fallback

### Data Loading Mechanism
```typescript
// Tab loading is triggered via onValueChange handler
onValueChange={(value) => {
  if (['all', 'pricing', 'inventory', 'market'].includes(value)) {
    handleTabLoad(value);
  }
  if (value === 'history' && !allTabDataFetched) {
    handleTabLoad('all'); // History depends on All tab data
  }
}}
```

### API Error Handling
- Graceful degradation for missing data
- User-friendly error messages
- Console warnings for debugging
- Toast notifications for user feedback

## Development Guidelines

### Adding New Tabs
1. Create component in `/components/rfq-tabs/`
2. Add proper loading states with Loader2
3. Include error handling
4. Add tab cache management if needed
5. Export from `/components/rfq-tabs/index.ts`
6. Add to main page with proper props

### Code Conventions
- Use TypeScript interfaces for all props
- Follow existing loading state patterns
- Include proper error boundaries
- Use consistent naming conventions
- Add JSDoc comments for complex functions

### Testing Considerations
- Mock API responses for development
- Test loading states thoroughly
- Verify currency conversion accuracy
- Test tab switching and caching

## Common Issues & Solutions

### Performance
- Implemented tab-level caching (5-minute timeout)
- Lazy loading for tab data
- PrimeReact virtualization for large datasets

### Data Consistency
- History tab reuses All tab data
- Centralized currency conversion
- Consistent error handling patterns

### UI/UX
- Responsive design with mobile considerations
- Consistent loading animations
- Proper empty states
- Accessibility considerations

## Recent Updates
- Fixed loading components across all tabs (standardized to Loader2)
- Commented out negotiation and settings tabs
- Improved tab switching with automatic data loading
- Enhanced History tab to use All tab data efficiently
- Updated AllTab to show proper loading states

## API Endpoints Structure
```
/api/rfq/[id]/
├── all-data (comprehensive item data)
├── pricing-data (pricing analysis)
├── inventory-data (stock information)
├── market-data (market pricing)
├── quotation/ (quotation management)
├── communications/ (customer communications)
└── export/ (data export)
```

## Future Considerations
- Re-enable negotiation tab when needed
- Consider implementing real-time updates
- Potential GraphQL migration for complex queries
- Enhanced mobile responsiveness
- Advanced filtering and search capabilities