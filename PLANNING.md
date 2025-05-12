# UDS Prototype: Planning Document

## Project Vision

The UDS Prototype is designed to revolutionize the Request for Quote (RFQ) process by automating manual tasks, integrating with accounting systems, and providing powerful tools for quote management. This planning document outlines the architecture, implementation phases, and technical decisions for the project.

## System Architecture

### High-Level Architecture

```
┌────────────────┐     ┌───────────────┐     ┌────────────────┐
│                │     │               │     │                │
│  Client Layer  │────▶│  Application  │────▶│  Data Layer    │
│  (Next.js UI)  │     │  Layer (API)  │     │  (DB & Integrations) │
│                │     │               │     │                │
└────────────────┘     └───────────────┘     └────────────────┘
```

### Frontend Architecture

- **Framework**: Next.js with App Router for server components and routing
- **UI Library**: React with TypeScript for type safety
- **Styling**: Tailwind CSS for utility-first styling
- **Component Library**: shadcn/ui for accessible, customizable components
- **State Management**: React Context for global state, React Query for server state
- **Form Management**: React Hook Form with Zod for validation

### Backend Architecture

- **API Framework**: Next.js API routes for backend functionality
- **ORM**: Drizzle ORM for type-safe database access
- **Authentication**: NextAuth.js for secure authentication
- **Email Processing**: Custom email parsing service with API integration
- **Integration Layer**: Middleware for connecting with QuickBooks and marketplace APIs

### Database Schema

```
┌────────────────┐       ┌────────────────┐       ┌────────────────┐
│                │       │                │       │                │
│    Users       │───────│     RFQs       │───────│    Products    │
│                │       │                │       │                │
└────────────────┘       └────────────────┘       └────────────────┘
                                  │
                                  │
                         ┌────────┴───────┐
                         │                │
                         │   Customers    │
                         │                │
                         └────────────────┘
```

#### Key Tables:

- **Users**: Application users with roles and permissions
- **RFQs**: Request for Quotes with status, items, pricing
- **Customers**: Customer information and contact details
- **Products**: Product catalog with specifications and pricing

## Implementation Phases

### Phase 1: Foundation (Current Phase)

- Setup Next.js project with TypeScript and Tailwind CSS
- Implement basic UI components and layouts
- Create database schema and ORM integration
- Develop authentication system
- Establish API structure

**Deliverables:**
- Working application shell with authentication
- Basic dashboard layout
- Database connection and schema
- Initial API endpoints for RFQ creation

### Phase 2: Core RFQ Functionality

- Implement RFQ creation and management workflows
- Develop customer management features
- Create product catalog management
- Build quoting engine with price calculations
- Implement basic reporting

**Deliverables:**
- Complete RFQ management interface
- Customer and product management
- Quote generation and approval flow
- Basic reporting dashboard

### Phase 3: Integrations

- Implement QuickBooks integration for financial data sync
- Develop email parsing for automated RFQ creation
- Build marketplace data connectors
- Create notification system

**Deliverables:**
- Working QuickBooks synchronization
- Email parsing for automatic RFQ generation
- Marketplace connectors for external data
- Email and in-app notifications

### Phase 4: Advanced Features and Optimization

- Implement advanced reporting and analytics
- Develop machine learning for price suggestions
- Create customer portal for quote approval
- Optimize performance and scalability

**Deliverables:**
- Advanced reporting with visualizations
- AI-powered price suggestions
- Customer-facing portal
- Performance optimizations

## Technical Decisions

### QuickBooks Integration Approach

- Use QuickBooks API for bidirectional sync
- Implement OAuth for secure authentication
- Create middleware layer to normalize data formats
- Schedule regular sync jobs for data consistency

### Email Parsing Strategy

- Use IMAP or API-based email retrieval
- Implement NLP for extracting RFQ details
- Create rules engine for routing and classification
- Store original emails as references

### Marketplace Integration

- Develop adapter pattern for consistent API interfaces
- Implement webhook receivers for real-time updates
- Create normalization layer for data standardization
- Build rate limiting and caching mechanisms

## API Structure

### RESTful API Endpoints

- `/api/auth/*`: Authentication endpoints
- `/api/rfq/*`: RFQ management endpoints
- `/api/customers/*`: Customer management endpoints
- `/api/products/*`: Product catalog endpoints
- `/api/integrations/*`: Integration management endpoints

### API Response Format

```json
{
  "success": true,
  "data": { ... },
  "error": null,
  "meta": {
    "pagination": { ... }
  }
}
```

## Testing Strategy

### Unit Testing

- Jest for JavaScript/TypeScript testing
- React Testing Library for component tests
- MSW for API mocking

### Integration Testing

- Cypress for end-to-end testing
- API integration tests for backend
- Database integration tests

### Testing Guidelines

- Aim for 80% code coverage minimum
- Test all API endpoints
- Create smoke tests for critical paths
- Implement CI/CD pipeline for automated testing

## Performance Considerations

- Implement server-side pagination for large datasets
- Use React Query for efficient data fetching and caching
- Optimize database queries with proper indexing
- Implement CDN for static assets
- Use Next.js ISR (Incremental Static Regeneration) where appropriate

## Security Measures

- Implement proper authentication and authorization
- Use CSRF protection for all forms
- Sanitize user inputs
- Implement rate limiting for API endpoints
- Regular security audits and dependency updates

## Scalability Planning

- Design for horizontal scaling
- Implement database connection pooling
- Use caching for frequently accessed data
- Consider microservices architecture for future growth

## Accessibility Standards

- Follow WCAG 2.1 AA guidelines
- Implement keyboard navigation
- Ensure proper contrast ratios
- Add aria attributes to interactive elements
- Test with screen readers

This planning document serves as the central reference for all development activities on the UDS Prototype project. All feature implementations, code changes, and technical decisions should align with the architecture and approach outlined here.



## API Endpoints Overview

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/user` - Get current authenticated user information

### RFQ Management Endpoints
- `GET /api/rfq/list` - Get all RFQs with filters and pagination
- `POST /api/rfq/create` - Create a new RFQ
- `GET /api/rfq/:id` - Get a specific RFQ by ID
- `PATCH /api/rfq/:id` - Update a specific RFQ
- `PATCH /api/rfq/:id/status` - Update RFQ status
- `POST /api/rfq/:id/quote` - Generate a quote from an RFQ
- `GET /api/rfq/search` - Search through RFQs
- `GET /api/rfq/templates` - Get RFQ templates
- `GET /api/rfq/templates/:id` - Get a specific template
- `POST /api/rfq/templates/create` - Create a new RFQ template
- `PATCH /api/rfq/templates/:id` - Update a template
- `DELETE /api/rfq/templates/:id` - Delete a template
- `GET /api/rfq/:id/export` - Export an RFQ to PDF/Excel

### Customer Management Endpoints
- `GET /api/customers/list` - Get all customers with filters and pagination
- `POST /api/customers/create` - Create a new customer
- `GET /api/customers/:id` - Get a specific customer by ID
- `PATCH /api/customers/:id` - Update a specific customer
- `GET /api/customers/:id/history` - Get customer purchase history
- `GET /api/customers/search` - Search through customers

### Inventory/SKU Management Endpoints
- `GET /api/inventory/list` - Get all inventory items with filters and pagination
- `POST /api/inventory/create` - Create a new inventory item
- `GET /api/inventory/:id` - Get a specific inventory item by ID
- `PATCH /api/inventory/:id` - Update a specific inventory item
- `GET /api/inventory/search` - Search through inventory items
- `GET /api/inventory/low-stock` - Get items with low stock
- `GET /api/inventory/:id/history` - Get sales history for an item

### SKU Mapping Endpoints
- `GET /api/sku-mapping/list` - Get all SKU mappings
- `POST /api/sku-mapping/create` - Create a new SKU mapping
- `GET /api/sku-mapping/:id` - Get a specific SKU mapping
- `PATCH /api/sku-mapping/:id` - Update a specific SKU mapping
- `DELETE /api/sku-mapping/:id` - Delete a SKU mapping
- `POST /api/sku-mapping/detect` - Detect and suggest SKU mappings for non-standard SKUs

### QuickBooks Integration Endpoints
- `GET /api/integrations/quickbooks/auth` - Authenticate with QuickBooks
- `GET /api/integrations/quickbooks/callback` - OAuth callback URL
- `POST /api/integrations/quickbooks/sync` - Sync data with QuickBooks
- `GET /api/integrations/quickbooks/check-connection` - Check QuickBooks connection status
- `GET /api/integrations/quickbooks/items` - Get items from QuickBooks
- `GET /api/integrations/quickbooks/customers` - Get customers from QuickBooks
- `POST /api/integrations/quickbooks/push-estimate` - Push RFQ as an estimate to QuickBooks

### Marketplace Data Integration Endpoints
- `GET /api/marketplace/prices` - Get marketplace prices for SKUs
- `POST /api/marketplace/update` - Update marketplace data
- `GET /api/marketplace/sources` - Get available marketplace sources
- `GET/PATCH /api/marketplace/sources/:id/settings` - Get or update marketplace source settings

### Email Parsing Endpoints
- `POST /api/email/parse` - Parse email content to extract RFQ data
- `POST /api/email/parse-attachment` - Parse Excel/CSV attachments
- `GET/PATCH /api/email/settings` - Get or update email parsing settings

### Dashboard and Reporting Endpoints
- `GET /api/dashboard/metrics` - Get dashboard metrics
- `GET /api/dashboard/rfq-stats` - Get RFQ statistics
- `GET /api/dashboard/inventory-stats` - Get inventory statistics
- `GET /api/dashboard/customer-stats` - Get customer statistics
- `POST /api/reports/generate` - Generate a custom report
- `GET /api/reports/list` - Get saved reports
- `GET /api/reports/:id` - Get a specific report

### Currency Management Endpoints
- `GET/PATCH /api/settings/currency` - Get or update currency settings
- `POST /api/currency/convert` - Convert amounts between currencies
- `GET /api/currency/rates` - Get current exchange rates

### System Configuration Endpoints
- `GET/PATCH /api/settings/system` - Get or update system settings
- `GET/PATCH /api/settings/user-preferences` - Get or update user preferences