import { pgTable, serial, varchar, text, timestamp, boolean, integer, pgEnum, real, date, uuid, foreignKey, jsonb } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';

// Define the RFQ status type
export type RfqStatus = 'NEW' | 'DRAFT' | 'PRICED' | 'SENT' | 'NEGOTIATING' | 'ACCEPTED' | 'DECLINED' | 'PROCESSED';

// Enums - Only create if they don't exist
export const rfqStatusEnum = pgEnum('rfq_status', [
  'NEW',
  'DRAFT',
  'PRICED',
  'SENT',
  'NEGOTIATING',
  'ACCEPTED',
  'DECLINED',
  'PROCESSED'
]);
export const userRoleEnum = pgEnum('user_role', ['ADMIN', 'MANAGER', 'EMPLOYEE', 'SALES']);
export const customerTypeEnum = pgEnum('customer_type', ['WHOLESALER', 'DEALER', 'RETAILER', 'DIRECT']);

// Users Table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  password: varchar('password', { length: 255 }).notNull(),
  role: userRoleEnum('role').notNull().default('EMPLOYEE'),
  department: varchar('department', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  rfqs: many(rfqs),
  comments: many(comments),
  actions: many(auditLog, { relationName: 'userActions' }),
}));

// Customers Table
export const customers = pgTable('customers', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  type: customerTypeEnum('type').notNull(),
  region: varchar('region', { length: 100 }),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 50 }),
  address: text('address'),
  contactPerson: varchar('contact_person', { length: 255 }),
  quickbooksId: varchar('quickbooks_id', { length: 100 }),
  isActive: boolean('is_active').default(true).notNull(),
  main_customer: boolean('main_customer').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const customersRelations = relations(customers, ({ many }) => ({
  rfqs: many(rfqs),
  quotations: many(quotations),
  skuVariations: many(skuVariations),
  salesHistory: many(salesHistory),
}));

// Vendors Table
export const vendors = pgTable('vendors', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 50 }),
  address: text('address'),
  contactPerson: varchar('contact_person', { length: 255 }),
  category: varchar('category', { length: 100 }),
  isActive: boolean('is_active').default(true).notNull(),
  quickbooksId: varchar('quickbooks_id', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const vendorsRelations = relations(vendors, ({ many }) => ({
  rfqs: many(rfqs),
  quotations: many(quotations),
  purchaseOrders: many(purchaseOrders),
}));

// RFQs Table
export const rfqs = pgTable('rfqs', {
  id: serial('id').primaryKey(),
  rfqNumber: varchar('rfq_number', { length: 100 }).notNull().unique(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  requestorId: integer('requestor_id').references(() => users.id).notNull(),
  customerId: integer('customer_id').references(() => customers.id).notNull(),
  vendorId: integer('vendor_id').references(() => vendors.id),
  status: rfqStatusEnum('status').default('NEW').notNull(),
  dueDate: date('due_date'),
  attachments: jsonb('attachments').$type<string[]>(),
  totalBudget: real('total_budget'),
  approvedBy: integer('approved_by').references(() => users.id),
  rejectionReason: text('rejection_reason'),
  source: varchar('source', { length: 100 }).notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const rfqsRelations = relations(rfqs, ({ one, many }) => ({
  requestor: one(users, {
    fields: [rfqs.requestorId],
    references: [users.id],
  }),
  customer: one(customers, {
    fields: [rfqs.customerId],
    references: [customers.id],
  }),
  vendor: one(vendors, {
    fields: [rfqs.vendorId],
    references: [vendors.id],
  }),
  items: many(rfqItems),
  quotations: many(quotations),
  comments: many(comments),
  history: many(auditLog, { relationName: 'rfqHistory' }),
  versions: many(quotationVersions),
}));

// RFQ Items Table
export const rfqItems = pgTable('rfq_items', {
  id: serial('id').primaryKey(),
  rfqId: integer('rfq_id').references(() => rfqs.id).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  quantity: integer('quantity').notNull(),
  unit: varchar('unit', { length: 50 }),
  customerSku: varchar('customer_sku', { length: 100 }),
  internalProductId: integer('internal_product_id').references(() => inventoryItems.id),
  suggestedPrice: real('suggested_price'),
  finalPrice: real('final_price'),
  currency: varchar('currency', { length: 3 }).notNull().default('CAD'),
  status: varchar('status', { length: 50 }).notNull().default('PENDING'),
  estimatedPrice: real('estimated_price'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const rfqItemsRelations = relations(rfqItems, ({ one }) => ({
  rfq: one(rfqs, {
    fields: [rfqItems.rfqId],
    references: [rfqs.id],
  }),
  product: one(inventoryItems, {
    fields: [rfqItems.internalProductId],
    references: [inventoryItems.id],
  }),
}));

// Quotations Table
export const quotations = pgTable('quotations', {
  id: serial('id').primaryKey(),
  quoteNumber: varchar('quote_number', { length: 100 }).notNull().unique(),
  rfqId: integer('rfq_id').references(() => rfqs.id).notNull(),
  customerId: integer('customer_id').references(() => customers.id).notNull(),
  vendorId: integer('vendor_id').references(() => vendors.id).notNull(),
  totalAmount: real('total_amount').notNull(),
  deliveryTime: varchar('delivery_time', { length: 100 }),
  validUntil: date('valid_until'),
  termsAndConditions: text('terms_and_conditions'),
  attachments: jsonb('attachments').$type<string[]>(),
  isSelected: boolean('is_selected').default(false),
  status: varchar('status', { length: 50 }).notNull().default('PENDING'),
  notes: text('notes'),
  expiryDate: date('expiry_date'),
  createdBy: integer('created_by').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const quotationsRelations = relations(quotations, ({ one, many }) => ({
  rfq: one(rfqs, {
    fields: [quotations.rfqId],
    references: [rfqs.id],
  }),
  customer: one(customers, {
    fields: [quotations.customerId],
    references: [customers.id],
  }),
  vendor: one(vendors, {
    fields: [quotations.vendorId],
    references: [vendors.id],
  }),
  items: many(quotationItems),
  creator: one(users, {
    fields: [quotations.createdBy],
    references: [users.id],
  }),
}));

// Quotation Items Table
export const quotationItems = pgTable('quotation_items', {
  id: serial('id').primaryKey(),
  quotationId: integer('quotation_id').references(() => quotations.id).notNull(),
  rfqItemId: integer('rfq_item_id').references(() => rfqItems.id).notNull(),
  productId: integer('product_id').references(() => inventoryItems.id).notNull(),
  unitPrice: real('unit_price').notNull(),
  quantity: integer('quantity').notNull(),
  extendedPrice: real('extended_price').notNull(),
  currency: varchar('currency', { length: 3 }).notNull().default('CAD'),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const quotationItemsRelations = relations(quotationItems, ({ one }) => ({
  quotation: one(quotations, {
    fields: [quotationItems.quotationId],
    references: [quotations.id],
  }),
  rfqItem: one(rfqItems, {
    fields: [quotationItems.rfqItemId],
    references: [rfqItems.id],
  }),
  product: one(inventoryItems, {
    fields: [quotationItems.productId],
    references: [inventoryItems.id],
  }),
}));

// Comments Table
export const comments = pgTable('comments', {
  id: serial('id').primaryKey(),
  content: text('content').notNull(),
  userId: integer('user_id').references(() => users.id).notNull(),
  rfqId: integer('rfq_id').references(() => rfqs.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const commentsRelations = relations(comments, ({ one }) => ({
  user: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
  rfq: one(rfqs, {
    fields: [comments.rfqId],
    references: [rfqs.id],
  }),
}));

// Email Templates Table
export const emailTemplates = pgTable('email_templates', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  subject: varchar('subject', { length: 255 }).notNull(),
  body: text('body').notNull(),
  variables: jsonb('variables').$type<string[]>(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Settings Table
export const settings = pgTable('settings', {
  id: serial('id').primaryKey(),
  key: varchar('key', { length: 255 }).notNull().unique(),
  value: text('value').notNull(),
  description: text('description'),
  updatedBy: integer('updated_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// SKU Mappings Table
export const skuMappings = pgTable('sku_mappings', {
  id: serial('id').primaryKey(),
  standardSku: varchar('standard_sku', { length: 100 }).notNull().unique(),
  standardDescription: text('standard_description').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const skuMappingsRelations = relations(skuMappings, ({ many }) => ({
  variations: many(skuVariations),
}));

// SKU Variations Table (Customer-specific SKUs)
export const skuVariations = pgTable('sku_variations', {
  id: serial('id').primaryKey(),
  mappingId: integer('mapping_id').references(() => skuMappings.id, { onDelete: 'cascade' }).notNull(),
  customerId: integer('customer_id').references(() => customers.id, { onDelete: 'cascade' }).notNull(),
  variationSku: varchar('variation_sku', { length: 100 }).notNull(),
  source: varchar('source', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const skuVariationsRelations = relations(skuVariations, ({ one }) => ({
  mapping: one(skuMappings, {
    fields: [skuVariations.mappingId],
    references: [skuMappings.id],
  }),
  customer: one(customers, {
    fields: [skuVariations.customerId],
    references: [customers.id],
  }),
}));

// Audit Log Table
export const auditLog = pgTable('audit_log', {
  id: serial('id').primaryKey(),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  userId: integer('user_id').references(() => users.id),
  action: varchar('action', { length: 255 }).notNull(),
  entityType: varchar('entity_type', { length: 50 }),
  entityId: integer('entity_id'),
  details: jsonb('details'),
});

// Inventory Items Table
export const inventoryItems = pgTable('inventory_items', {
  id: serial('id').primaryKey(),
  sku: varchar('sku', { length: 100 }).notNull().unique(),
  mpn: varchar('mpn', { length: 100 }).notNull(),
  brand: varchar('brand', { length: 100 }).notNull(),
  category: varchar('category', { length: 50 }).notNull().default('OTHER'),
  description: text('description').notNull(),
  stock: integer('stock').default(0).notNull(),
  costCad: real('cost_cad'),
  costUsd: real('cost_usd'),
  warehouseLocation: varchar('warehouse_location', { length: 100 }),
  quantityOnHand: integer('quantity_on_hand').notNull().default(0),
  quantityReserved: integer('quantity_reserved').notNull().default(0),
  lowStockThreshold: integer('low_stock_threshold').default(5),
  lastSaleDate: date('last_sale_date'),
  quickbooksItemId: varchar('quickbooks_item_id', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const inventoryItemsRelations = relations(inventoryItems, ({ many }) => ({
  rfqItems: many(rfqItems),
  quoteItems: many(quotationItems),
  salesHistory: many(salesHistory),
  poItems: many(poItems),
  marketPricings: many(marketPricing),
}));

// Sales History Table
export const salesHistory = pgTable('sales_history', {
  id: serial('id').primaryKey(),
  invoiceNumber: varchar('invoice_number', { length: 100 }).notNull(),
  customerId: integer('customer_id').references(() => customers.id).notNull(),
  productId: integer('product_id').references(() => inventoryItems.id).notNull(),
  quantity: integer('quantity').notNull(),
  unitPrice: real('unit_price').notNull(),
  extendedPrice: real('extended_price').notNull(),
  currency: varchar('currency', { length: 3 }).notNull().default('CAD'),
  saleDate: date('sale_date').notNull(),
  quickbooksInvoiceId: varchar('quickbooks_invoice_id', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const salesHistoryRelations = relations(salesHistory, ({ one }) => ({
  customer: one(customers, {
    fields: [salesHistory.customerId],
    references: [customers.id],
  }),
  product: one(inventoryItems, {
    fields: [salesHistory.productId],
    references: [inventoryItems.id],
  }),
}));

// Purchase Orders Table
export const purchaseOrders = pgTable('purchase_orders', {
  id: serial('id').primaryKey(),
  poNumber: varchar('po_number', { length: 100 }).notNull().unique(),
  vendorId: integer('vendor_id').references(() => vendors.id).notNull(),
  status: varchar('status', { length: 50 }).notNull(),
  orderDate: timestamp('order_date').notNull(),
  expectedArrivalDate: date('expected_arrival_date'),
  totalAmount: real('total_amount').notNull(),
  currency: varchar('currency', { length: 3 }).notNull().default('CAD'),
  quickbooksPoId: varchar('quickbooks_po_id', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const purchaseOrdersRelations = relations(purchaseOrders, ({ one, many }) => ({
  vendor: one(vendors, {
    fields: [purchaseOrders.vendorId],
    references: [vendors.id],
  }),
  items: many(poItems),
}));

// Purchase Order Items Table
export const poItems = pgTable('po_items', {
  id: serial('id').primaryKey(),
  poId: integer('po_id').references(() => purchaseOrders.id).notNull(),
  productId: integer('product_id').references(() => inventoryItems.id).notNull(),
  quantity: integer('quantity').notNull(),
  unitCost: real('unit_cost').notNull(),
  extendedCost: real('extended_cost').notNull(),
  currency: varchar('currency', { length: 3 }).notNull().default('CAD'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const poItemsRelations = relations(poItems, ({ one }) => ({
  purchaseOrder: one(purchaseOrders, {
    fields: [poItems.poId],
    references: [purchaseOrders.id],
  }),
  product: one(inventoryItems, {
    fields: [poItems.productId],
    references: [inventoryItems.id],
  }),
}));

// Market Pricing Table
export const marketPricing = pgTable('market_pricing', {
  id: serial('id').primaryKey(),
  productId: integer('product_id').references(() => inventoryItems.id).notNull(),
  source: varchar('source', { length: 255 }).notNull(),
  price: real('price').notNull(),
  currency: varchar('currency', { length: 3 }).notNull().default('CAD'),
  lastUpdated: timestamp('last_updated').defaultNow().notNull(),
});

export const marketPricingRelations = relations(marketPricing, ({ one }) => ({
  product: one(inventoryItems, {
    fields: [marketPricing.productId],
    references: [inventoryItems.id],
  }),
}));

// RFQ Templates Table
export const rfqTemplates = pgTable('rfq_templates', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  columns: jsonb('columns').$type<any[]>(),
  isActive: boolean('is_active').default(true).notNull(),
  createdBy: integer('created_by').references(() => users.id).notNull(),
  metadata: jsonb('metadata').$type<any>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const rfqTemplatesRelations = relations(rfqTemplates, ({ one }) => ({
  creator: one(users, {
    fields: [rfqTemplates.createdBy],
    references: [users.id],
  }),
}));

// Email Settings Table
export const emailSettings = pgTable('email_settings', {
  id: serial('id').primaryKey(),
  enabled: boolean('enabled').default(true).notNull(),
  checkInterval: integer('check_interval').default(5).notNull(), // minutes
  skuDetectionEnabled: boolean('sku_detection_enabled').default(true).notNull(),
  skuAutoMap: boolean('sku_auto_map').default(true).notNull(),
  skuConfidenceThreshold: integer('sku_confidence_threshold').default(85).notNull(),
  customerDetectionEnabled: boolean('customer_detection_enabled').default(true).notNull(),
  customerAutoAssign: boolean('customer_auto_assign').default(true).notNull(),
  customerConfidenceThreshold: integer('customer_confidence_threshold').default(80).notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Email Accounts Table
export const emailAccounts = pgTable('email_accounts', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  protocol: varchar('protocol', { length: 50 }).notNull(),
  server: varchar('server', { length: 255 }).notNull(),
  port: integer('port').notNull(),
  ssl: boolean('ssl').default(true).notNull(),
  username: varchar('username', { length: 255 }).notNull(),
  password: varchar('password', { length: 255 }).notNull(),
  folders: jsonb('folders').$type<string[]>().default(['INBOX']),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Email Rules Table
export const emailRules = pgTable('email_rules', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  condition: varchar('condition', { length: 255 }).notNull(),
  action: varchar('action', { length: 50 }).notNull().default('parse'),
  prioritize: boolean('prioritize').default(false).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Email Parsing Results (for audit/history)
export const emailParsingResults = pgTable('email_parsing_results', {
  id: serial('id').primaryKey(),
  messageId: varchar('message_id', { length: 255 }),
  subject: varchar('subject', { length: 255 }),
  sender: varchar('sender', { length: 255 }),
  receivedAt: timestamp('received_at'),
  parsedAt: timestamp('parsed_at').defaultNow().notNull(),
  customerInfo: jsonb('customer_info'),
  items: jsonb('items').$type<any[]>(),
  confidence: integer('confidence'),
  status: varchar('status', { length: 50 }).notNull().default('PROCESSED'),
  rfqId: integer('rfq_id').references(() => rfqs.id),
  notes: text('notes'),
});

// Add email-related relations
export const emailSettingsRelations = relations(emailSettings, ({ }) => ({}));

export const emailAccountsRelations = relations(emailAccounts, ({ }) => ({}));

export const emailRulesRelations = relations(emailRules, ({ }) => ({}));

export const emailParsingResultsRelations = relations(emailParsingResults, ({ one }) => ({
  rfq: one(rfqs, {
    fields: [emailParsingResults.rfqId],
    references: [rfqs.id],
  }),
}));

// Reports Table
export const reports = pgTable('reports', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  type: varchar('type', { length: 50 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdBy: integer('created_by').references(() => users.id),
  filters: jsonb('filters').$type<Record<string, any>>(),
  data: jsonb('data').$type<Record<string, any>>(),
});

export const reportsRelations = relations(reports, ({ one }) => ({
  creator: one(users, {
    fields: [reports.createdBy],
    references: [users.id],
  }),
}));

export const quotationVersions = pgTable('quotation_versions', {
  id: serial('id').primaryKey(),
  rfqId: integer('rfq_id').notNull(),
  versionNumber: integer('version_number').notNull(),
  status: varchar('status', { length: 20 }).notNull().default('NEW'),
  estimatedPrice: integer('estimated_price').notNull(),
  finalPrice: integer('final_price').notNull(),
  changes: text('changes'),
  createdBy: varchar('created_by', { length: 100 }).notNull(),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

export const quotationVersionsRelations = relations(quotationVersions, ({ one, many }) => ({
  rfq: one(rfqs, {
    fields: [quotationVersions.rfqId],
    references: [rfqs.id],
  }),
  responses: many(customerResponses),
}));

export const customerResponses = pgTable('customer_responses', {
  id: serial('id').primaryKey(),
  versionId: integer('version_id').notNull(),
  status: varchar('status', { length: 20 }).notNull(),
  comments: text('comments'),
  requestedChanges: text('requested_changes'),
  respondedAt: timestamp('responded_at').default(sql`CURRENT_TIMESTAMP`),
});

export const customerResponsesRelations = relations(customerResponses, ({ one }) => ({
  version: one(quotationVersions, {
    fields: [customerResponses.versionId],
    references: [quotationVersions.id],
  }),
}));