# PostgreSQL Enum Search Fix - Complete Solution

## Problem Identified
`PostgresError: operator does not exist: rfq_status ~~* unknown`

The `ilike` operator cannot be used directly on PostgreSQL enum types. It needs explicit casting to text.

## Root Cause
The search was failing because:
1. `rfqs.status` is an enum type (`rfq_status`)
2. `customers.type` is an enum type (`customer_type`) 
3. `users.role` is an enum type (`user_role`)
4. PostgreSQL's `ilike` operator (case-insensitive LIKE) requires text types

## Solution Applied

### Enum Type Casting
All enum fields now use explicit casting to text:

```typescript
// Before (causes error):
ilike(rfqs.status, `%${searchQuery}%`)

// After (works correctly):
ilike(sql`${rfqs.status}::text`, `%${searchQuery}%`)
```

### Complete Search Implementation
Both endpoints now support comprehensive search across all fields:

**RFQ Fields:**
- ✅ RFQ Number (varchar)
- ✅ Title (varchar) 
- ✅ Description (text)
- ✅ Source (varchar)
- ✅ Status (enum → cast to text)
- ✅ Rejection Reason (text)

**Customer Fields:**
- ✅ Customer Name (varchar)
- ✅ Customer Type (enum → cast to text)
- ✅ Email (varchar)
- ✅ Phone (varchar) 
- ✅ Contact Person (varchar)
- ✅ Region (varchar)

**User/Requestor Fields:**
- ✅ User Name (varchar)
- ✅ User Email (varchar)
- ✅ Department (varchar)
- ✅ Role (enum → cast to text)

### Implementation Details

```typescript
const searchConditions = or(
  // RFQ specific fields
  ilike(rfqs.rfqNumber, `%${searchQuery}%`),
  ilike(rfqs.source, `%${searchQuery}%`),
  ilike(sql`${rfqs.status}::text`, `%${searchQuery}%`), // Cast enum
  and(isNotNull(rfqs.title), ilike(rfqs.title, `%${searchQuery}%`)),
  and(isNotNull(rfqs.description), ilike(rfqs.description, `%${searchQuery}%`)),
  and(isNotNull(rfqs.rejectionReason), ilike(rfqs.rejectionReason, `%${searchQuery}%`)),
  
  // Customer related fields
  ilike(customers.name, `%${searchQuery}%`),
  ilike(sql`${customers.type}::text`, `%${searchQuery}%`), // Cast enum
  and(isNotNull(customers.email), ilike(customers.email, `%${searchQuery}%`)),
  and(isNotNull(customers.phone), ilike(customers.phone, `%${searchQuery}%`)),
  and(isNotNull(customers.contactPerson), ilike(customers.contactPerson, `%${searchQuery}%`)),
  and(isNotNull(customers.region), ilike(customers.region, `%${searchQuery}%`)),
  
  // User/Requestor related fields
  ilike(users.name, `%${searchQuery}%`),
  and(isNotNull(users.email), ilike(users.email, `%${searchQuery}%`)),
  and(isNotNull(users.department), ilike(users.department, `%${searchQuery}%`)),
  ilike(sql`${users.role}::text`, `%${searchQuery}%`) // Cast enum
);
```

## Search Capabilities

Users can now search for:

**By Status:** "new", "draft", "priced", "sent", "negotiating", "accepted", "declined", "processed"

**By Customer Type:** "wholesaler", "dealer", "retailer", "direct"

**By User Role:** "admin", "manager", "employee", "sales"

**By any text field:** names, emails, phone numbers, descriptions, etc.

## Files Modified
1. `/app/api/rfq/search/route.ts` - Fixed enum casting, restored comprehensive search
2. `/app/api/rfq/route.ts` - Fixed enum casting, added comprehensive search

## Key Learning
When working with PostgreSQL enums in Drizzle ORM:
- Always cast enums to text for string operations: `sql\`\${enumField}::text\``
- Use `isNotNull()` for nullable fields to prevent errors
- The `ilike` operator is for case-insensitive LIKE operations

The search now works correctly with full coverage across all relevant database fields!