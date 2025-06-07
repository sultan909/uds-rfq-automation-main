# Comprehensive Search Enhancement - RFQ Management

## Enhancement Overview
The search functionality in the RFQ management page has been enhanced to search across ALL relevant fields in the database, providing users with a powerful and intuitive search experience.

## Enhanced Search Fields

### RFQ-Specific Fields
- **RFQ Number**: Primary identifier for the RFQ
- **Title**: Short title/name of the RFQ
- **Description**: Detailed description of the request
- **Source**: Origin/channel of the RFQ (email, phone, etc.)
- **Status**: Current status (NEW, DRAFT, PRICED, SENT, etc.)
- **Rejection Reason**: Reason for rejection (if applicable)

### Customer-Related Fields
- **Customer Name**: Company/individual name
- **Customer Email**: Contact email address
- **Customer Phone**: Contact phone number
- **Contact Person**: Primary contact at the customer
- **Region**: Geographic region/location
- **Customer Type**: WHOLESALER, DEALER, RETAILER, DIRECT

### User/Requestor Fields
- **Requestor Name**: Name of the person who created the RFQ
- **Requestor Email**: Email of the requestor
- **Department**: Department the requestor belongs to

## Implementation Details

### Backend API Enhancement
Both `/api/rfq` (list) and `/api/rfq/search` endpoints now use comprehensive search:

```typescript
// Search across all relevant fields using OR conditions
const searchConditions = or(
  // RFQ specific fields
  ilike(rfqs.rfqNumber, `%${searchQuery}%`),
  ilike(rfqs.source, `%${searchQuery}%`),
  ilike(rfqs.status, `%${searchQuery}%`),
  and(isNotNull(rfqs.title), ilike(rfqs.title, `%${searchQuery}%`)),
  and(isNotNull(rfqs.description), ilike(rfqs.description, `%${searchQuery}%`)),
  and(isNotNull(rfqs.rejectionReason), ilike(rfqs.rejectionReason, `%${searchQuery}%`)),
  // Customer related fields
  ilike(customers.name, `%${searchQuery}%`),
  and(isNotNull(customers.email), ilike(customers.email, `%${searchQuery}%`)),
  and(isNotNull(customers.phone), ilike(customers.phone, `%${searchQuery}%`)),
  and(isNotNull(customers.contactPerson), ilike(customers.contactPerson, `%${searchQuery}%`)),
  and(isNotNull(customers.region), ilike(customers.region, `%${searchQuery}%`)),
  ilike(customers.type, `%${searchQuery}%`),
  // User/Requestor related fields
  ilike(users.name, `%${searchQuery}%`),
  and(isNotNull(users.email), ilike(users.email, `%${searchQuery}%`)),
  and(isNotNull(users.department), ilike(users.department, `%${searchQuery}%`))
);
```

### Frontend Enhancement
Updated the search placeholder to inform users about the comprehensive search capabilities:

```jsx
<Input 
  value={searchValue} 
  onChange={handleSearchChange} 
  placeholder="Search RFQs by number, customer, source, status, description, contact person, email, phone, department..."
  className="w-full sm:w-[400px] pl-9"
/>
```

## Search Features

### Case-Insensitive Search
- Uses `ilike` operator for case-insensitive matching
- Users can search with any case combination

### Partial Matching
- Supports partial string matching with `%` wildcards
- Users can search for parts of words or phrases

### Null-Safe Operations
- Uses `isNotNull()` checks before searching nullable fields
- Prevents errors when fields contain null values

### Multi-Field Coverage
- Single search query searches across 15+ different fields
- Users get comprehensive results from one search input

## Usage Examples

Users can now search for:

1. **By RFQ Number**: "RFQ-2024-001"
2. **By Customer**: "Acme Corp", "acme", "corp"
3. **By Status**: "new", "draft", "priced"
4. **By Contact Info**: "john@company.com", "555-1234"
5. **By Location**: "Toronto", "Ontario"
6. **By Description**: "LED lights", "office supplies"
7. **By Department**: "Sales", "Procurement"
8. **By Contact Person**: "John Smith", "jane"

## Performance Considerations

- Database indexes should be considered for frequently searched fields
- The search uses OR conditions which may impact performance on large datasets
- Consider adding full-text search for even better performance in the future

## Files Modified
1. `app/api/rfq/route.ts` - Enhanced list endpoint search
2. `app/api/rfq/search/route.ts` - Enhanced dedicated search endpoint  
3. `app/rfq-management/page.tsx` - Updated search placeholder text

The search functionality now provides a comprehensive, user-friendly experience that matches modern search expectations across all relevant data fields.