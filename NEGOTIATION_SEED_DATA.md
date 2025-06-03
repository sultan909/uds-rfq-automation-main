# Negotiation Seed Data Added ✅

## Summary
Added comprehensive seed data for the negotiation system to `scripts/seed.ts`, including:

### 1. Negotiation Communications Seed Data
**Features:**
- **2-8 communications per negotiatable RFQ** (RFQs with status: NEGOTIATING, ACCEPTED, DECLINED, PROCESSED)
- **Realistic communication types**: EMAIL, PHONE_CALL, MEETING, INTERNAL_NOTE
- **Bidirectional communications**: Both INBOUND and OUTBOUND
- **Context-aware content**: Different content based on communication type and direction
- **Follow-up tracking**: 30% of communications require follow-ups, 70% completion rate
- **Time-realistic**: Communications spread over the last 30 days during business hours

**Sample Data Includes:**
- Professional email exchanges about pricing and delivery
- Phone call summaries with specific negotiation points
- Meeting notes from face-to-face discussions
- Internal notes for strategy and competitive analysis
- Follow-up reminders and completion tracking

### 2. SKU Negotiation History Seed Data
**Features:**
- **1-3 SKU changes per RFQ with communications**
- **Three change types**: PRICE_CHANGE, QUANTITY_CHANGE, BOTH
- **Realistic value changes**: 
  - Quantity: ±10-50% adjustments
  - Price: 5-20% adjustments (customers typically want lower prices)
- **Change source tracking**: CUSTOMER vs INTERNAL initiated changes
- **Linked to communications**: 70% of changes linked to specific communications
- **Detailed change reasons**: Context-specific explanations for each change type

**Sample Change Reasons:**
- **Price Changes**: Volume discounts, competitive pressure, budget constraints
- **Quantity Changes**: Updated requirements, inventory optimization, project scope changes  
- **Both Changes**: Volume tier adjustments, contract renegotiations, market condition responses

### 3. Data Relationships
**Smart Linking:**
- Communications linked to specific RFQ versions (60% probability)
- SKU changes linked to communications that triggered them (70% probability)
- Realistic user assignments (SALES, MANAGER, ADMIN roles for negotiations)
- Time-sequenced data (communications first, then changes follow)

### 4. Realistic Business Scenarios
**Generated scenarios include:**
- Customer requesting volume discounts via email
- Phone negotiations about delivery timelines
- In-person meetings for contract terms
- Internal strategy notes about competitive pricing
- Follow-up reminders for pending customer responses
- Price adjustments based on market conditions
- Quantity changes due to project scope modifications

### 5. Updated Truncation
Added negotiation tables to the truncation list:
```sql
TRUNCATE TABLE
  negotiation_communications,
  sku_negotiation_history,
  ...
```

## Usage

### Run the Seed Script:
```bash
# From the project root
cd E:\Web-development-Business\Mai-Automations\Cody-by-client\nabeel\uds-rfq
npm run seed
# or
npx tsx scripts/seed.ts
```

### Expected Results:
- **~50-150 negotiation communications** across all negotiatable RFQs
- **~30-80 SKU change records** with realistic value adjustments
- **Proper relationships** between communications, changes, and RFQs
- **Time-realistic data** for testing timeline features
- **Professional content** for UI testing and demonstrations

## Benefits for Testing

### 1. **Complete Negotiation Workflows**
- Test communication logging and editing
- Verify SKU change tracking and history display
- Validate follow-up management systems

### 2. **Realistic User Scenarios**
- Sales team recording customer communications
- Management tracking negotiation progress
- Historical analysis of pricing changes

### 3. **UI Component Testing**
- Timeline displays with real communication data
- Change history tables with meaningful content
- Follow-up indicators and completion tracking

### 4. **Data Integrity Testing**
- Proper foreign key relationships
- Realistic value ranges and changes
- Time sequence validation

## Sample Data Preview

### Communication Example:
```
Type: EMAIL (OUTBOUND)
Subject: "Quote Update for RFQ RFQ-12345"
Content: "Hi John, I wanted to follow up on your RFQ RFQ-12345. 
         We've reviewed your requirements and have some updated 
         pricing to discuss..."
Follow-up: Required (Due: 3 days)
```

### SKU Change Example:
```
Change Type: BOTH
Old Quantity: 25 → New Quantity: 40
Old Price: $45.00 → New Price: $42.50
Reason: "Volume pricing tier adjustment with quantity increase"
Changed By: CUSTOMER
Linked Communication: "Phone negotiation about volume discounts"
```

The seed data now provides a complete testing environment for the Enhanced Negotiation System! 🎉
