-- Part 4: Business Tables

-- 15. Sales History Table
CREATE TABLE IF NOT EXISTS sales_history (
  id SERIAL PRIMARY KEY,
  invoice_number VARCHAR(100) NOT NULL,
  customer_id INTEGER REFERENCES customers(id) NOT NULL,
  product_id INTEGER REFERENCES inventory_items(id) NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price REAL NOT NULL,
  extended_price REAL NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'CAD',
  sale_date DATE NOT NULL,
  quickbooks_invoice_id VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 16. Purchase Orders Table
CREATE TABLE IF NOT EXISTS purchase_orders (
  id SERIAL PRIMARY KEY,
  po_number VARCHAR(100) NOT NULL UNIQUE,
  vendor_id INTEGER REFERENCES vendors(id) NOT NULL,
  status VARCHAR(50) NOT NULL,
  order_date TIMESTAMP NOT NULL,
  expected_arrival_date DATE,
  total_amount REAL NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'CAD',
  quickbooks_po_id VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 17. Purchase Order Items Table
CREATE TABLE IF NOT EXISTS po_items (
  id SERIAL PRIMARY KEY,
  po_id INTEGER REFERENCES purchase_orders(id) NOT NULL,
  product_id INTEGER REFERENCES inventory_items(id) NOT NULL,
  quantity INTEGER NOT NULL,
  unit_cost REAL NOT NULL,
  extended_cost REAL NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'CAD',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 18. Market Pricing Table
CREATE TABLE IF NOT EXISTS market_pricing (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES inventory_items(id) NOT NULL,
  source VARCHAR(255) NOT NULL,
  price REAL NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'CAD',
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);
