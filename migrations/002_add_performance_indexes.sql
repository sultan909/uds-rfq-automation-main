-- Performance Optimization Indexes for UDS RFQ System
-- Migration: 002_add_performance_indexes.sql

-- RFQs table indexes (frequently queried columns)
CREATE INDEX IF NOT EXISTS idx_rfqs_customer_id ON rfqs(customer_id);
CREATE INDEX IF NOT EXISTS idx_rfqs_status ON rfqs(status);
CREATE INDEX IF NOT EXISTS idx_rfqs_created_at ON rfqs(created_at);
CREATE INDEX IF NOT EXISTS idx_rfqs_rfq_number ON rfqs(rfq_number);
CREATE INDEX IF NOT EXISTS idx_rfqs_requestor_id ON rfqs(requestor_id);

-- RFQ Items table indexes
CREATE INDEX IF NOT EXISTS idx_rfq_items_rfq_id ON rfq_items(rfq_id);
CREATE INDEX IF NOT EXISTS idx_rfq_items_customer_sku ON rfq_items(customer_sku);
CREATE INDEX IF NOT EXISTS idx_rfq_items_internal_product_id ON rfq_items(internal_product_id);
CREATE INDEX IF NOT EXISTS idx_rfq_items_status ON rfq_items(status);

-- Customers table indexes
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_type ON customers(type);
CREATE INDEX IF NOT EXISTS idx_customers_is_active ON customers(is_active);
CREATE INDEX IF NOT EXISTS idx_customers_main_customer ON customers(main_customer);

-- Inventory Items table indexes  
CREATE INDEX IF NOT EXISTS idx_inventory_items_sku ON inventory_items(sku);
CREATE INDEX IF NOT EXISTS idx_inventory_items_category ON inventory_items(category);
CREATE INDEX IF NOT EXISTS idx_inventory_items_is_active ON inventory_items(is_active);
CREATE INDEX IF NOT EXISTS idx_inventory_items_quantity_on_hand ON inventory_items(quantity_on_hand);

-- Sales History table indexes (for reporting and analytics)
CREATE INDEX IF NOT EXISTS idx_sales_history_customer_id ON sales_history(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_history_product_id ON sales_history(product_id);
CREATE INDEX IF NOT EXISTS idx_sales_history_sale_date ON sales_history(sale_date);
CREATE INDEX IF NOT EXISTS idx_sales_history_customer_product ON sales_history(customer_id, product_id);
CREATE INDEX IF NOT EXISTS idx_sales_history_date_range ON sales_history(sale_date, customer_id);

-- Purchase Orders table indexes
CREATE INDEX IF NOT EXISTS idx_purchase_orders_vendor_id ON purchase_orders(vendor_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_order_date ON purchase_orders(order_date);

-- PO Items table indexes
CREATE INDEX IF NOT EXISTS idx_po_items_po_id ON po_items(po_id);
CREATE INDEX IF NOT EXISTS idx_po_items_product_id ON po_items(product_id);

-- Quotations table indexes
CREATE INDEX IF NOT EXISTS idx_quotations_rfq_id ON quotations(rfq_id);
CREATE INDEX IF NOT EXISTS idx_quotations_customer_id ON quotations(customer_id);
CREATE INDEX IF NOT EXISTS idx_quotations_vendor_id ON quotations(vendor_id);
CREATE INDEX IF NOT EXISTS idx_quotations_status ON quotations(status);
CREATE INDEX IF NOT EXISTS idx_quotations_created_at ON quotations(created_at);

-- Quotation Versions table indexes
CREATE INDEX IF NOT EXISTS idx_quotation_versions_rfq_id ON quotation_versions(rfq_id);
CREATE INDEX IF NOT EXISTS idx_quotation_versions_status ON quotation_versions(status);
CREATE INDEX IF NOT EXISTS idx_quotation_versions_created_at ON quotation_versions(created_at);

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_department ON users(department);

-- Audit Log table indexes (for tracking and monitoring)
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity_type ON audit_log(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity_id ON audit_log(entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON audit_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_action ON audit_log(user_id, action);

-- SKU Mappings table indexes
CREATE INDEX IF NOT EXISTS idx_sku_mappings_customer_sku ON sku_mappings(customer_sku);
CREATE INDEX IF NOT EXISTS idx_sku_mappings_internal_sku ON sku_mappings(internal_sku);
CREATE INDEX IF NOT EXISTS idx_sku_mappings_customer_id ON sku_mappings(customer_id);

-- Negotiation Communications table indexes
CREATE INDEX IF NOT EXISTS idx_negotiation_communications_rfq_id ON negotiation_communications(rfq_id);
CREATE INDEX IF NOT EXISTS idx_negotiation_communications_version_id ON negotiation_communications(version_id);
CREATE INDEX IF NOT EXISTS idx_negotiation_communications_created_at ON negotiation_communications(created_at);

-- Customer Responses table indexes
CREATE INDEX IF NOT EXISTS idx_customer_responses_version_id ON customer_responses(version_id);
CREATE INDEX IF NOT EXISTS idx_customer_responses_responded_at ON customer_responses(responded_at);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_rfqs_customer_status ON rfqs(customer_id, status);
CREATE INDEX IF NOT EXISTS idx_rfqs_status_created ON rfqs(status, created_at);
CREATE INDEX IF NOT EXISTS idx_inventory_active_category ON inventory_items(is_active, category);
CREATE INDEX IF NOT EXISTS idx_sales_history_date_customer ON sales_history(sale_date DESC, customer_id);

-- Partial indexes for better performance on filtered queries
CREATE INDEX IF NOT EXISTS idx_rfqs_active_status ON rfqs(customer_id, created_at) WHERE status IN ('PENDING', 'IN_PROGRESS');
CREATE INDEX IF NOT EXISTS idx_inventory_low_stock ON inventory_items(sku, quantity_on_hand) WHERE quantity_on_hand < reorder_point;
CREATE INDEX IF NOT EXISTS idx_active_customers ON customers(name, type) WHERE is_active = true;

-- Full-text search indexes (if using PostgreSQL text search)
-- CREATE INDEX IF NOT EXISTS idx_rfqs_search ON rfqs USING gin(to_tsvector('english', rfq_number || ' ' || COALESCE(notes, '')));
-- CREATE INDEX IF NOT EXISTS idx_customers_search ON customers USING gin(to_tsvector('english', name || ' ' || COALESCE(email, '')));
-- CREATE INDEX IF NOT EXISTS idx_inventory_search ON inventory_items USING gin(to_tsvector('english', sku || ' ' || description));

-- Analyze tables to update statistics after creating indexes
ANALYZE rfqs;
ANALYZE rfq_items; 
ANALYZE customers;
ANALYZE inventory_items;
ANALYZE sales_history;
ANALYZE purchase_orders;
ANALYZE po_items;
ANALYZE quotations;
ANALYZE quotation_versions;
ANALYZE users;
ANALYZE audit_log;
ANALYZE sku_mappings;
ANALYZE negotiation_communications;
ANALYZE customer_responses;