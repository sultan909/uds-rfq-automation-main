# SKU-Level Quotation + Negotiation History Feature

## Overview

This feature implements a versioned negotiation system on the RFQ Detail Page at the SKU level. It includes editable SKU tables, full quotation history tracking, entry type management, and automated status transitions.

## Implementation Summary

### ✅ Database Changes

#### Enhanced Tables:
- **quotation_versions**: Added `entry_type`, `notes`, `submitted_by_user_id` fields
- **quotation_items**: New table for SKU-level data within versions
- **rfqs**: Added `current_version_id` reference field

#### Key Features:
- Automatic version numbering per RFQ
- SKU-level pricing and negotiation comments
- Entry type tracking (internal_quote, customer_feedback, counter_offer)
- Foreign key relationships for data integrity

### ✅ API Enhancements

#### New Endpoints:
- `POST /api/rfq/:id/quotation` - Create quotation from Items tab
- Enhanced `GET /api/rfq/:id/versions` - Returns SKU-level data
- Enhanced `POST /api/rfq/:id/versions` - Handles entry types and items

#### Features:
- Input validation and business logic
- Automatic status transitions
- Error handling and transaction safety
- Complete item data in responses

### ✅ UI Components

#### New Components:
1. **EditableItemsTable** - Inline editing for Items tab
2. **QuotationHistoryTable** - Enhanced history with expandable rows
3. **Enhanced VersionCreationModal** - Entry type and item selection

#### Features:
- Inline editing with save/cancel functionality
- Expandable version details with SKU breakdown
- Entry type selection and validation
- Real-time total calculations

### ✅ Business Logic

#### Status Transitions:
- `SENT` + internal_quote → `NEGOTIATING`
- `NEW/DRAFT` + internal_quote → `PRICED`
- Customer feedback → `NEGOTIATING`
- Counter offers → `NEGOTIATING`

#### Validation Rules:
- Editable states: `DRAFT`, `SENT`, `NEGOTIATING`
- Version creation allowed until `ACCEPTED`/`PROCESSED`
- Input validation for pricing and quantities