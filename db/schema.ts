import { pgTable, serial, varchar, text, timestamp, boolean, integer, pgEnum, real, date, uuid, foreignKey, jsonb } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';

// Enums
export const rfqStatusEnum = pgEnum('rfq_status', ['PENDING', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'COMPLETED']);
export const userRoleEnum = pgEnum('user_role', ['ADMIN', 'MANAGER', 'EMPLOYEE']);

// Tables
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
}));

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
}));

export const rfqs = pgTable('rfqs', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  requestorId: integer('requestor_id').references(() => users.id).notNull(),
  vendorId: integer('vendor_id').references(() => vendors.id),
  status: rfqStatusEnum('status').default('PENDING').notNull(),
  dueDate: date('due_date'),
  attachments: jsonb('attachments').$type<string[]>(),
  totalBudget: real('total_budget'),
  approvedBy: integer('approved_by').references(() => users.id),
  rejectionReason: text('rejection_reason'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const rfqsRelations = relations(rfqs, ({ one, many }) => ({
  requestor: one(users, {
    fields: [rfqs.requestorId],
    references: [users.id],
  }),
  vendor: one(vendors, {
    fields: [rfqs.vendorId],
    references: [vendors.id],
  }),
  items: many(rfqItems),
  quotations: many(quotations),
  comments: many(comments),
}));

export const rfqItems = pgTable('rfq_items', {
  id: serial('id').primaryKey(),
  rfqId: integer('rfq_id').references(() => rfqs.id).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  quantity: integer('quantity').notNull(),
  unit: varchar('unit', { length: 50 }),
  estimatedPrice: real('estimated_price'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const rfqItemsRelations = relations(rfqItems, ({ one }) => ({
  rfq: one(rfqs, {
    fields: [rfqItems.rfqId],
    references: [rfqs.id],
  }),
}));

export const quotations = pgTable('quotations', {
  id: serial('id').primaryKey(),
  rfqId: integer('rfq_id').references(() => rfqs.id).notNull(),
  vendorId: integer('vendor_id').references(() => vendors.id).notNull(),
  totalAmount: real('total_amount'),
  deliveryTime: varchar('delivery_time', { length: 100 }),
  validUntil: date('valid_until'),
  termsAndConditions: text('terms_and_conditions'),
  attachments: jsonb('attachments').$type<string[]>(),
  isSelected: boolean('is_selected').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const quotationsRelations = relations(quotations, ({ one, many }) => ({
  rfq: one(rfqs, {
    fields: [quotations.rfqId],
    references: [rfqs.id],
  }),
  vendor: one(vendors, {
    fields: [quotations.vendorId],
    references: [vendors.id],
  }),
  items: many(quotationItems),
}));

export const quotationItems = pgTable('quotation_items', {
  id: serial('id').primaryKey(),
  quotationId: integer('quotation_id').references(() => quotations.id).notNull(),
  rfqItemId: integer('rfq_item_id').references(() => rfqItems.id).notNull(),
  unitPrice: real('unit_price').notNull(),
  quantity: integer('quantity').notNull(),
  totalPrice: real('total_price').notNull(),
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
}));

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

export const settings = pgTable('settings', {
  id: serial('id').primaryKey(),
  key: varchar('key', { length: 255 }).notNull().unique(),
  value: text('value').notNull(),
  description: text('description'),
  updatedBy: integer('updated_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Example additions to db/schema.ts:
export const skuMappings = pgTable('sku_mappings', {
  id: serial('id').primaryKey(),
  standardSku: varchar('standard_sku', { length: 100 }).notNull().unique(),
  standardDescription: text('standard_description').notNull(),
  // Potentially add category, brand, etc.
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const skuVariations = pgTable('sku_variations', {
  id: serial('id').primaryKey(),
  mappingId: integer('mapping_id').references(() => skuMappings.id, { onDelete: 'cascade' }).notNull(),
  variationSku: varchar('variation_sku', { length: 100 }).notNull(),
  source: varchar('source', { length: 255 }).notNull(), // e.g., Customer Name, 'Email Import', 'Manual Entry'
  // Optional: Add confidence score if detected automatically
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  // Consider unique constraint on (mappingId, variationSku, source)
});

export const skuMappingsRelations = relations(skuMappings, ({ many }) => ({
  variations: many(skuVariations),
}));

export const skuVariationsRelations = relations(skuVariations, ({ one }) => ({
    mapping: one(skuMappings, {
      fields: [skuVariations.mappingId],
      references: [skuMappings.id],
    }),
}));

// Example addition to db/schema.ts:
export const auditLog = pgTable('audit_log', {
  id: serial('id').primaryKey(),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  userId: integer('user_id').references(() => users.id), // User who performed the action (null for system)
  action: varchar('action', { length: 255 }).notNull(), // e.g., 'RFQ Created', 'Status Updated', 'Item Added'
  entityType: varchar('entity_type', { length: 50 }), // e.g., 'RFQ', 'Customer', 'Inventory'
  entityId: integer('entity_id'), // ID of the entity affected
  details: jsonb('details'), // Store before/after values or specific changes
  // Consider adding IP address, session ID etc.
});

// Optional relation if you often query history per RFQ
export const rfqHistoryRelation = relations(rfqs, ({ many }) => ({
    history: many(auditLog, { relationName: 'rfqHistory' }), // Requires careful filtering on entityType/entityId in queries
}));
export const userHistoryRelation = relations(users, ({ many }) => ({
    actions: many(auditLog, { relationName: 'userActions' }),
}));


// Example addition to db/schema.ts:
export const inventoryItems = pgTable('inventory_items', {
  id: serial('id').primaryKey(),
  sku: varchar('sku', { length: 100 }).notNull().unique(),
  description: text('description').notNull(),
  stock: integer('stock').default(0).notNull(),
  costCad: real('cost_cad'), // Cost in CAD
  costUsd: real('cost_usd'), // Cost in USD (optional, or calculate)
  // Add fields like category, brand, location, supplier_id, etc.
  lowStockThreshold: integer('low_stock_threshold').default(5),
  lastSaleDate: date('last_sale_date'),
  quickbooksItemId: varchar('quickbooks_item_id', { length: 100 }), // For QB integration
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
// Potentially add relations to vendors (suppliers)