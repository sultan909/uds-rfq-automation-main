-- Complete Database Setup Script for UDS RFQ System
-- Run this in your PostgreSQL database

-- Create Enums
DO $$ BEGIN
  CREATE TYPE rfq_status AS ENUM ('NEW', 'DRAFT', 'PRICED', 'SENT', 'NEGOTIATING', 'ACCEPTED', 'DECLINED', 'PROCESSED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('ADMIN', 'MANAGER', 'EMPLOYEE', 'SALES');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE customer_type AS ENUM ('WHOLESALER', 'DEALER', 'RETAILER', 'DIRECT');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'EMPLOYEE',
  department VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 2. Customers Table
CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type customer_type NOT NULL,
  region VARCHAR(100),
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  contact_person VARCHAR(255),
  quickbooks_id VARCHAR(100),
  is_active BOOLEAN DEFAULT true NOT NULL,
  main_customer BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 3. Vendors Table
CREATE TABLE IF NOT EXISTS vendors (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  contact_person VARCHAR(255),
  category VARCHAR(100),
  is_active BOOLEAN DEFAULT true NOT NULL,
  quickbooks_id VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 4. Inventory Items Table
CREATE TABLE IF NOT EXISTS inventory_items (
  id SERIAL PRIMARY KEY,
  sku VARCHAR(100) NOT NULL UNIQUE,
  mpn VARCHAR(100) NOT NULL,
  brand VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL DEFAULT 'OTHER',
  description TEXT NOT NULL,
  stock INTEGER DEFAULT 0 NOT NULL,
  cost_cad REAL,
  cost_usd REAL,
  warehouse_location VARCHAR(100),
  quantity_on_hand INTEGER NOT NULL DEFAULT 0,
  quantity_reserved INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 5,
  last_sale_date DATE,
  quickbooks_item_id VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);
-- Part 2: Main Tables

-- 5. RFQs Table
CREATE TABLE IF NOT EXISTS rfqs (
  id SERIAL PRIMARY KEY,
  rfq_number VARCHAR(100) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  requestor_id INTEGER REFERENCES users(id) NOT NULL,
  customer_id INTEGER REFERENCES customers(id) NOT NULL,
  vendor_id INTEGER REFERENCES vendors(id),
  status rfq_status DEFAULT 'NEW' NOT NULL,
  due_date DATE,
  attachments JSONB,
  total_budget REAL,
  approved_by INTEGER REFERENCES users(id),
  rejection_reason TEXT,
  source VARCHAR(100) NOT NULL,
  notes TEXT,
  current_version_id INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 6. RFQ Items Table
CREATE TABLE IF NOT EXISTS rfq_items (
  id SERIAL PRIMARY KEY,
  rfq_id INTEGER REFERENCES rfqs(id) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  quantity INTEGER NOT NULL,
  unit VARCHAR(50),
  customer_sku VARCHAR(100),
  internal_product_id INTEGER REFERENCES inventory_items(id),
  suggested_price REAL,
  final_price REAL,
  currency VARCHAR(3) NOT NULL DEFAULT 'CAD',
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
  estimated_price REAL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 7. Quotations Table
CREATE TABLE IF NOT EXISTS quotations (
  id SERIAL PRIMARY KEY,
  quote_number VARCHAR(100) NOT NULL UNIQUE,
  rfq_id INTEGER REFERENCES rfqs(id) NOT NULL,
  customer_id INTEGER REFERENCES customers(id) NOT NULL,
  vendor_id INTEGER REFERENCES vendors(id) NOT NULL,
  total_amount REAL NOT NULL,
  delivery_time VARCHAR(100),
  valid_until DATE,
  terms_and_conditions TEXT,
  attachments JSONB,
  is_selected BOOLEAN DEFAULT false,
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
  notes TEXT,
  expiry_date DATE,
  created_by INTEGER REFERENCES users(id) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 8. Quotation Items Table
CREATE TABLE IF NOT EXISTS quotation_items (
  id SERIAL PRIMARY KEY,
  quotation_id INTEGER REFERENCES quotations(id) NOT NULL,
  rfq_item_id INTEGER REFERENCES rfq_items(id) NOT NULL,
  product_id INTEGER REFERENCES inventory_items(id) NOT NULL,
  unit_price REAL NOT NULL,
  quantity INTEGER NOT NULL,
  extended_price REAL NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'CAD',
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);
