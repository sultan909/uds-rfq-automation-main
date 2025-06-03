-- Sample data for testing the new quotation versioning feature

-- Insert sample users (if not exists)
INSERT INTO users (email, name, password, role) VALUES
('admin@test.com', 'Admin User', 'hashed_password', 'ADMIN'),
('sales@test.com', 'Sales User', 'hashed_password', 'SALES')
ON CONFLICT (email) DO NOTHING;

-- Insert sample customers (if not exists)
INSERT INTO customers (name, type, email, phone, is_active) VALUES
('Acme Corporation', 'WHOLESALER', 'orders@acme.com', '555-0100', true),
('Tech Solutions Ltd', 'RETAILER', 'purchasing@techsol.com', '555-0200', true)
ON CONFLICT (name) DO NOTHING;

-- Insert sample inventory items (if not exists)
INSERT INTO inventory_items (sku, mpn, brand, category, description, stock, cost_cad, quantity_on_hand, low_stock_threshold) VALUES
('SKU001', 'MPN001', 'TechBrand', 'ELECTRONICS', 'Wireless Mouse', 100, 25.50, 100, 10),
('SKU002', 'MPN002', 'TechBrand', 'ELECTRONICS', 'USB Keyboard', 50, 45.75, 50, 5),
('SKU003', 'MPN003', 'OfficeBrand', 'OFFICE', 'Desk Lamp', 75, 35.25, 75, 8)
ON CONFLICT (sku) DO NOTHING;

-- Insert sample RFQ (if not exists)
INSERT INTO rfqs (rfq_number, title, description, requestor_id, customer_id, status, source, total_budget) 
SELECT 
    'RFQ-2025-001', 
    'Office Equipment Request', 
    'Request for various office equipment for new branch', 
    u.id, 
    c.id, 
    'DRAFT', 
    'EMAIL', 
    1000.00
FROM users u, customers c 
WHERE u.email = 'sales@test.com' 
AND c.name = 'Acme Corporation'
ON CONFLICT (rfq_number) DO NOTHING;

-- Insert sample RFQ items
INSERT INTO rfq_items (rfq_id, name, description, quantity, unit, customer_sku, internal_product_id, suggested_price, currency)
SELECT 
    r.id,
    i.description,
    i.description,
    10,
    'EA',
    'CUST-' || i.sku,
    i.id,
    i.cost_cad * 1.3, -- 30% markup
    'CAD'
FROM rfqs r, inventory_items i
WHERE r.rfq_number = 'RFQ-2025-001'
ON CONFLICT DO NOTHING;
