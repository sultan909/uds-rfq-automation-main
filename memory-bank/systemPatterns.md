# System Patterns

## System Architecture
- Modular, component-based architecture (React-based frontend with Next.js)
- RESTful API for backend communication
- Database for persistent storage (PostgreSQL)
- Integration modules for QuickBooks API and external marketplace APIs (planned)
- Automated data extraction pipeline for emails and Excel attachments (planned)
- **ROBUST**: Error handling and data validation layer throughout the stack
- **DOCUMENTED**: Comprehensive project intelligence and development standards

## Project Directory Structure

### Root Level
```
/
├── .next/                      # Next.js build output
├── .git/                       # Git repository
├── app/                        # Next.js App Router pages and API routes
├── components/                 # Reusable React components
├── contexts/                   # React Context providers
├── db/                         # Database schema and configuration
├── docs/                       # Project documentation
├── drizzle/                    # Database migration files
├── hooks/                      # Custom React hooks
├── lib/                        # Utility libraries and shared functions
├── memory-bank/                # Project memory and documentation
├── node_modules/               # Dependencies
├── public/                     # Static assets
├── scripts/                    # Build and utility scripts
├── styles/                     # Global styles and CSS
├── .cursorrules                # Project intelligence patterns
├── .claude-rules               # Claude-specific rules
├── PLANNING.md                 # Project planning document
├── README.md                   # Project documentation
├── package.json                # Dependencies and scripts
├── tsconfig.json               # TypeScript configuration
├── tailwind.config.ts          # Tailwind CSS configuration
├── drizzle.config.ts           # Database configuration
├── next.config.mjs             # Next.js configuration
└── postman.json                # API testing collection
```

### App Directory (Next.js App Router)
```
app/
├── api/                        # Backend API routes
│   ├── auth/                   # Authentication endpoints
│   ├── customers/              # Customer management API
│   ├── currency/               # Currency conversion API
│   ├── dashboard/              # Dashboard data API
│   ├── email/                  # Email processing API
│   ├── integrations/           # External integrations API
│   ├── inventory/              # Inventory management API
│   ├── lib/                    # Shared API utilities
│   ├── marketplace/            # Marketplace connector API
│   ├── reports/                # Reporting API
│   ├── rfq/                    # RFQ management API
│   ├── settings/               # Application settings API
│   ├── sku-mapping/            # SKU mapping API
│   └── vendors/                # Vendor management API
├── customers/                  # Customer management pages
├── inventory/                  # Inventory management pages
├── reports/                    # Reporting and analytics pages
├── rfq-management/             # RFQ detail and management pages
├── settings/                   # Application settings pages
├── sku-mapping/                # SKU mapping interface
├── theme-demo/                 # UI theme demonstration
├── globals.css                 # Global styles
├── layout.tsx                  # Root layout component
├── loading.tsx                 # Global loading component
└── page.tsx                    # Home/Dashboard page
```

### Components Directory
```
components/
├── ui/                         # shadcn/ui base components
├── reports/                    # Report-specific components
├── currency-toggle.tsx         # Currency switching component
├── customer-response-modal.tsx # Customer interaction modal
├── date-picker.tsx             # Date selection component
├── date-range-picker.tsx       # Date range selection component
├── email-parser.tsx            # Email processing component
├── header.tsx                  # Application header
├── sidebar.tsx                 # Navigation sidebar
├── sku-mapping-detector.tsx    # SKU detection component
├── spinner.tsx                 # Loading spinner component
├── table-customizer.tsx        # Table column customization
├── theme-provider.tsx          # Theme context provider
├── theme-toggle.tsx            # Dark/light mode toggle
├── version-creation-modal.tsx  # RFQ version management
└── version-status-manager.tsx  # Status management component
```

## API Structure

### RESTful Endpoints Organization
```
/api/
├── /auth                       # Authentication & Authorization
│   ├── POST /login             # User authentication
│   ├── POST /logout            # User logout
│   └── GET  /profile           # User profile data
├── /customers                  # Customer Management
│   ├── GET    /                # List customers with pagination
│   ├── POST   /                # Create new customer
│   ├── GET    /:id             # Get customer details
│   ├── PUT    /:id             # Update customer
│   ├── DELETE /:id             # Delete customer
│   └── GET    /:id/history     # Customer sales history
├── /currency                   # Currency Operations
│   ├── GET    /rates           # Exchange rates
│   └── POST   /convert         # Currency conversion
├── /dashboard                  # Dashboard Data
│   ├── GET    /stats           # Key metrics and statistics
│   └── GET    /recent          # Recent activity feed
├── /email                      # Email Processing
│   ├── POST   /parse           # Parse email content
│   ├── GET    /settings        # Email configuration
│   └── PUT    /settings        # Update email settings
├── /integrations              # External Integrations
│   ├── /quickbooks             # QuickBooks integration
│   └── /marketplaces           # Marketplace connectors
├── /inventory                 # Inventory Management
│   ├── GET    /                # List inventory items
│   ├── POST   /                # Create inventory item
│   ├── GET    /:id             # Get item details
│   ├── PUT    /:id             # Update inventory item
│   └── GET    /:id/history     # Item transaction history
├── /reports                   # Reporting & Analytics
│   ├── GET    /sales           # Sales reports
│   ├── GET    /inventory       # Inventory reports
│   └── GET    /rfq             # RFQ reports
├── /rfq                       # RFQ Management
│   ├── GET    /                # List RFQs with pagination
│   ├── POST   /                # Create new RFQ
│   ├── GET    /:id             # Get RFQ details
│   ├── PUT    /:id             # Update RFQ
│   ├── DELETE /:id             # Delete RFQ
│   ├── GET    /:id/items       # RFQ items
│   ├── GET    /:id/quotations  # RFQ quotations
│   ├── GET    /:id/history     # RFQ audit history
│   └── POST   /:id/quote       # Create quote from RFQ
├── /settings                  # Application Settings
│   ├── GET    /                # Get all settings
│   └── PUT    /:key            # Update specific setting
├── /sku-mapping               # SKU Mapping System
│   ├── GET    /                # List SKU mappings
│   ├── POST   /                # Create SKU mapping
│   ├── PUT    /:id             # Update SKU mapping
│   ├── DELETE /:id             # Delete SKU mapping
│   └── GET    /variations      # Get SKU variations
└── /vendors                   # Vendor Management
    ├── GET    /                # List vendors
    ├── POST   /                # Create vendor
    ├── GET    /:id             # Get vendor details
    └── PUT    /:id             # Update vendor
```

## Database Schema Structure and Relations

### Core Entity Tables

#### Users & Authentication
```sql
users
├── id (PK)
├── email (unique)
├── name
├── password
├── role (ADMIN|MANAGER|EMPLOYEE|SALES)
├── department
├── created_at, updated_at
└── Relations:
    ├── rfqs (one-to-many)
    ├── comments (one-to-many)
    └── audit_log (one-to-many)
```

#### Customers
```sql
customers
├── id (PK)
├── name
├── type (WHOLESALER|DEALER|RETAILER|DIRECT)
├── region, email, phone, address
├── contact_person
├── quickbooks_id
├── is_active, main_customer
├── created_at, updated_at
└── Relations:
    ├── rfqs (one-to-many)
    ├── quotations (one-to-many)
    ├── sku_variations (one-to-many)
    └── sales_history (one-to-many)
```

#### Vendors
```sql
vendors
├── id (PK)
├── name, email, phone, address
├── contact_person, category
├── is_active, quickbooks_id
├── created_at, updated_at
└── Relations:
    ├── rfqs (one-to-many)
    ├── quotations (one-to-many)
    └── purchase_orders (one-to-many)
```

### RFQ Management Tables

#### RFQs (Request for Quotations)
```sql
rfqs
├── id (PK)
├── rfq_number (unique)
├── title, description
├── requestor_id (FK → users.id)
├── customer_id (FK → customers.id)
├── vendor_id (FK → vendors.id)
├── status (NEW|DRAFT|PRICED|SENT|NEGOTIATING|ACCEPTED|DECLINED|PROCESSED)
├── due_date, total_budget
├── approved_by (FK → users.id)
├── rejection_reason, source, notes
├── attachments (JSON)
├── created_at, updated_at
└── Relations:
    ├── requestor (many-to-one → users)
    ├── customer (many-to-one → customers)
    ├── vendor (many-to-one → vendors)
    ├── items (one-to-many → rfq_items)
    ├── quotations (one-to-many → quotations)
    ├── comments (one-to-many → comments)
    ├── history (one-to-many → audit_log)
    └── versions (one-to-many → quotation_versions)
```

#### RFQ Items
```sql
rfq_items
├── id (PK)
├── rfq_id (FK → rfqs.id)
├── name, description, quantity, unit
├── customer_sku
├── internal_product_id (FK → inventory_items.id)
├── suggested_price, final_price, estimated_price
├── currency, status
├── created_at, updated_at
└── Relations:
    ├── rfq (many-to-one → rfqs)
    └── product (many-to-one → inventory_items)
```

### Quotation Management Tables

#### Quotations
```sql
quotations
├── id (PK)
├── quote_number (unique)
├── rfq_id (FK → rfqs.id)
├── customer_id (FK → customers.id)
├── vendor_id (FK → vendors.id)
├── total_amount, delivery_time
├── valid_until, expiry_date
├── terms_and_conditions, notes
├── attachments (JSON)
├── is_selected, status
├── created_by (FK → users.id)
├── created_at, updated_at
└── Relations:
    ├── rfq (many-to-one → rfqs)
    ├── customer (many-to-one → customers)
    ├── vendor (many-to-one → vendors)
    ├── items (one-to-many → quotation_items)
    └── creator (many-to-one → users)
```

#### Quotation Items
```sql
quotation_items
├── id (PK)
├── quotation_id (FK → quotations.id)
├── rfq_item_id (FK → rfq_items.id)
├── product_id (FK → inventory_items.id)
├── unit_price, quantity, extended_price
├── currency, description
├── created_at, updated_at
└── Relations:
    ├── quotation (many-to-one → quotations)
    ├── rfq_item (many-to-one → rfq_items)
    └── product (many-to-one → inventory_items)
```

#### Quotation Versions & Responses
```sql
quotation_versions
├── id (PK)
├── rfq_id (FK → rfqs.id)
├── version_number, status
├── estimated_price, final_price
├── changes, created_by
├── created_at, updated_at
└── Relations:
    ├── rfq (many-to-one → rfqs)
    └── responses (one-to-many → customer_responses)

customer_responses
├── id (PK)
├── version_id (FK → quotation_versions.id)
├── status, comments, requested_changes
├── responded_at
└── Relations:
    └── version (many-to-one → quotation_versions)
```

### Inventory Management Tables

#### Inventory Items
```sql
inventory_items
├── id (PK)
├── sku (unique), mpn, brand
├── category, description
├── stock, cost_cad, cost_usd
├── warehouse_location
├── quantity_on_hand, quantity_reserved
├── low_stock_threshold, last_sale_date
├── quickbooks_item_id
├── created_at, updated_at
└── Relations:
    ├── rfq_items (one-to-many)
    ├── quote_items (one-to-many)
    ├── sales_history (one-to-many)
    ├── po_items (one-to-many)
    └── market_pricings (one-to-many)
```

#### Sales History
```sql
sales_history
├── id (PK)
├── invoice_number
├── customer_id (FK → customers.id)
├── product_id (FK → inventory_items.id)
├── quantity, unit_price, extended_price
├── currency, sale_date
├── quickbooks_invoice_id
├── created_at, updated_at
└── Relations:
    ├── customer (many-to-one → customers)
    └── product (many-to-one → inventory_items)
```

### SKU Mapping System

#### SKU Mappings & Variations
```sql
sku_mappings
├── id (PK)
├── standard_sku (unique)
├── standard_description
├── created_at, updated_at
└── Relations:
    └── variations (one-to-many → sku_variations)

sku_variations
├── id (PK)
├── mapping_id (FK → sku_mappings.id)
├── customer_id (FK → customers.id)
├── variation_sku, source
├── created_at, updated_at
└── Relations:
    ├── mapping (many-to-one → sku_mappings)
    └── customer (many-to-one → customers)
```

### Purchase Order Management

#### Purchase Orders & Items
```sql
purchase_orders
├── id (PK)
├── po_number (unique)
├── vendor_id (FK → vendors.id)
├── status, order_date, expected_arrival_date
├── total_amount, currency
├── quickbooks_po_id
├── created_at, updated_at
└── Relations:
    ├── vendor (many-to-one → vendors)
    └── items (one-to-many → po_items)

po_items
├── id (PK)
├── po_id (FK → purchase_orders.id)
├── product_id (FK → inventory_items.id)
├── quantity, unit_cost, extended_cost
├── currency
├── created_at, updated_at
└── Relations:
    ├── purchase_order (many-to-one → purchase_orders)
    └── product (many-to-one → inventory_items)
```

### System Configuration Tables

#### Settings & Templates
```sql
settings
├── id (PK)
├── key (unique), value, description
├── updated_by (FK → users.id)
├── created_at, updated_at

email_templates
├── id (PK)
├── name, subject, body
├── variables (JSON)
├── is_active
├── created_at, updated_at

rfq_templates
├── id (PK)
├── name, description
├── columns (JSON), metadata (JSON)
├── is_active
├── created_by (FK → users.id)
├── created_at, updated_at
```

#### Email Processing System
```sql
email_settings
├── id (PK)
├── enabled, check_interval
├── sku_detection_enabled, sku_auto_map, sku_confidence_threshold
├── customer_detection_enabled, customer_auto_assign, customer_confidence_threshold
├── updated_at

email_accounts
├── id (PK)
├── email (unique), protocol, server, port
├── ssl, username, password
├── folders (JSON), is_active
├── created_at, updated_at

email_parsing_results
├── id (PK)
├── message_id, subject, sender
├── received_at, parsed_at
├── customer_info (JSON), items (JSON)
├── confidence, status
├── rfq_id (FK → rfqs.id), notes
```

### Audit & Reporting

#### Audit Log
```sql
audit_log
├── id (PK)
├── timestamp
├── user_id (FK → users.id)
├── action, entity_type, entity_id
├── details (JSON)

reports
├── id (PK)
├── name, description, type
├── created_by (FK → users.id)
├── filters (JSON), data (JSON)
├── created_at, updated_at

market_pricing
├── id (PK)
├── product_id (FK → inventory_items.id)
├── source, price, currency
├── last_updated
```

### Database Relationships Summary
- **Users** → **RFQs** (1:M) - User creates/manages RFQs
- **Customers** → **RFQs** (1:M) - Customer requests quotes
- **RFQs** → **RFQ Items** (1:M) - RFQ contains multiple items
- **RFQs** → **Quotations** (1:M) - RFQ generates multiple quotes
- **Quotations** → **Quotation Items** (1:M) - Quote contains multiple items
- **Inventory Items** → **RFQ Items** (1:M) - Products referenced in RFQs
- **Customers** → **SKU Variations** (1:M) - Customer-specific SKU mapping
- **SKU Mappings** → **SKU Variations** (1:M) - Standard to variation mapping
- **Vendors** → **Purchase Orders** (1:M) - Vendor supplies products
- **Purchase Orders** → **PO Items** (1:M) - PO contains multiple items

## Key Technical Decisions
- Emphasis on automation, integration, and data accuracy
- **CRITICAL**: Defensive programming patterns for financial data handling
- Comprehensive error handling for null/undefined/NaN values in currency displays
- **STANDARD**: shadcn/ui Table components for all table implementations
- **EXCEPTION**: PrimeReact DataTable only for advanced features requiring approval
- Secure authentication and authorization
- Scalable and maintainable codebase
- Robust error handling for integrations and data extraction
- Data mapping for SKU variations and customer-specific SKUs
- **ESTABLISHED**: Fallback value patterns (|| 0) for all numeric displays

## Design Patterns in Use
- MVC (Model-View-Controller) separation of concerns
- Repository pattern for data access
- Observer pattern for real-time updates/notifications
- Adapter pattern for integrating with external APIs (QuickBooks, marketplaces)
- Strategy pattern for pricing recommendations
- **IMPLEMENTED**: Null Object pattern for handling missing financial data
- **STANDARDIZED**: Defensive programming pattern for React component data safety
- **DOCUMENTED**: Component consistency pattern with approved libraries

## Component Relationships
- RFQ Intake Component (handles email, Excel, phone input) interacts with API and Dashboard
- Dashboard aggregates and displays RFQ, inventory, and sales data
- Integration modules synchronize data with QuickBooks and marketplaces (planned)
- Notification system observes RFQ status changes and integration events (planned)
- **ESTABLISHED**: Currency Context provides centralized, error-safe formatting for all financial displays
- **STANDARDIZED**: All table components use shadcn/ui with TableCustomizer for column management
- **DOCUMENTED**: .cursorrules serves as central repository for development patterns and standards

## Error Handling Patterns
- Currency formatting with comprehensive null/undefined/NaN protection
- React component safety with fallback values for all numeric displays
- Graceful degradation when API data is incomplete or malformed
- User-friendly error messages without exposing system internals
- Consistent error boundaries to prevent application crashes

## Documentation and Standards Patterns
- **PROJECT INTELLIGENCE**: .cursorrules documents all critical patterns and implementation standards
- **MEMORY BANK**: Comprehensive documentation of project state and architectural decisions
- **PLANNING ALIGNMENT**: PLANNING.md maintains accurate project status and phase tracking
- **COMPONENT STANDARDS**: Documented guidelines for table, form, and UI component selection
- **APPROVAL PROCESS**: Architectural changes require documentation updates and pattern consistency review 