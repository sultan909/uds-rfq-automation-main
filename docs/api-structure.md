# API Endpoints for UDS RFQ Management System

## Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/user` - Get current authenticated user information

## RFQ Management Endpoints
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

## Customer Management Endpoints
- `GET /api/customers/list` - Get all customers with filters and pagination
- `POST /api/customers/create` - Create a new customer
- `GET /api/customers/:id` - Get a specific customer by ID
- `PATCH /api/customers/:id` - Update a specific customer
- `GET /api/customers/:id/history` - Get customer purchase history
- `GET /api/customers/search` - Search through customers
- `GET /api/customers/search` - Search through customers

## Inventory/SKU Management Endpoints
- `GET /api/inventory/list` - Get all inventory items with filters and pagination
- `POST /api/inventory/create` - Create a new inventory item
- `GET /api/inventory/:id` - Get a specific inventory item by ID
- `PATCH /api/inventory/:id` - Update a specific inventory item
- `GET /api/inventory/search` - Search through inventory items
- `GET /api/inventory/search` - Search through inventory items
- `GET /api/inventory/low-stock` - Get items with low stock
- `GET /api/inventory/:id/history` - Get sales history for an item

## SKU Mapping Endpoints
- `GET /api/sku-mapping/list` - Get all SKU mappings
- `POST /api/sku-mapping/create` - Create a new SKU mapping
- `GET /api/sku-mapping/:id` - Get a specific SKU mapping
- `PATCH /api/sku-mapping/:id` - Update a specific SKU mapping
- `DELETE /api/sku-mapping/:id` - Delete a SKU mapping
- `POST /api/sku-mapping/detect` - Detect and suggest SKU mappings for non-standard SKUs
- `POST /api/sku-mapping/import` - Import SKU mappings from a file
- `GET /api/sku-mapping/export` - Export all SKU mappings

## QuickBooks Integration Endpoints
- `GET /api/integrations/quickbooks/auth` - Authenticate with QuickBooks
- `GET /api/integrations/quickbooks/callback` - OAuth callback URL
- `POST /api/integrations/quickbooks/sync` - Sync data with QuickBooks
- `GET /api/integrations/quickbooks/check-connection` - Check QuickBooks connection status
- `GET /api/integrations/quickbooks/items` - Get items from QuickBooks
- `GET /api/integrations/quickbooks/customers` - Get customers from QuickBooks
- `POST /api/integrations/quickbooks/push-estimate` - Push RFQ as an estimate to QuickBooks

## Marketplace Data Integration Endpoints
- `GET /api/marketplace/prices` - Get marketplace prices for SKUs
- `POST /api/marketplace/update` - Update marketplace data
- `GET /api/marketplace/sources` - Get available marketplace sources
- `GET/PATCH /api/marketplace/sources/:id/settings` - Get or update marketplace source settings

## Email Parsing Endpoints
- `POST /api/email/parse` - Parse email content to extract RFQ data
- `POST /api/email/parse-attachment` - Parse Excel/CSV attachments
- `GET/PATCH /api/email/settings` - Get or update email parsing settings

## Dashboard and Reporting Endpoints
- `GET /api/dashboard/metrics` - Get dashboard metrics
- `GET /api/dashboard/rfq-stats` - Get RFQ statistics
- `GET /api/dashboard/inventory-stats` - Get inventory statistics
- `GET /api/dashboard/customer-stats` - Get customer statistics
- `POST /api/reports/generate` - Generate a custom report
- `GET /api/reports/list` - Get saved reports
- `GET /api/reports/:id` - Get a specific report

## Currency Management Endpoints
- `GET/PATCH /api/settings/currency` - Get or update currency settings
- `POST /api/currency/convert` - Convert amounts between currencies
- `GET /api/currency/rates` - Get current exchange rates

## System Configuration Endpoints
- `GET/PATCH /api/settings/system` - Get or update system settings
- `GET/PATCH /api/settings/user-preferences` - Get or update user preferences