-- Part 5: Advanced Tables and Negotiation System

-- 19. Quotation Versions Table
CREATE TABLE IF NOT EXISTS quotation_versions (
  id SERIAL PRIMARY KEY,
  rfq_id INTEGER NOT NULL,
  version_number INTEGER NOT NULL,
  entry_type VARCHAR(20) NOT NULL DEFAULT 'internal_quote',
  status VARCHAR(20) NOT NULL DEFAULT 'NEW',
  estimated_price INTEGER NOT NULL,
  final_price INTEGER NOT NULL,
  changes TEXT,
  notes TEXT,
  created_by VARCHAR(100) NOT NULL,
  submitted_by_user_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 20. Quotation Version Items Table
CREATE TABLE IF NOT EXISTS quotation_version_items (
  id SERIAL PRIMARY KEY,
  version_id INTEGER REFERENCES quotation_versions(id) NOT NULL,
  sku_id INTEGER REFERENCES inventory_items(id) NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price REAL NOT NULL,
  total_price REAL NOT NULL,
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 21. Customer Responses Table
CREATE TABLE IF NOT EXISTS customer_responses (
  id SERIAL PRIMARY KEY,
  version_id INTEGER NOT NULL,
  status VARCHAR(20) NOT NULL,
  comments TEXT,
  requested_changes TEXT,
  responded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 22. NEGOTIATION COMMUNICATIONS TABLE
CREATE TABLE IF NOT EXISTS negotiation_communications (
  id SERIAL PRIMARY KEY,
  rfq_id INTEGER REFERENCES rfqs(id) NOT NULL,
  version_id INTEGER REFERENCES quotation_versions(id),
  communication_type VARCHAR(20) NOT NULL,
  direction VARCHAR(10) NOT NULL,
  subject VARCHAR(255),
  content TEXT NOT NULL,
  contact_person VARCHAR(255),
  communication_date TIMESTAMP NOT NULL,
  follow_up_required BOOLEAN DEFAULT false,
  follow_up_date TIMESTAMP,
  follow_up_completed BOOLEAN DEFAULT false,
  follow_up_completed_at TIMESTAMP,
  entered_by_user_id INTEGER REFERENCES users(id) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 23. SKU NEGOTIATION HISTORY TABLE
CREATE TABLE IF NOT EXISTS sku_negotiation_history (
  id SERIAL PRIMARY KEY,
  rfq_id INTEGER REFERENCES rfqs(id) NOT NULL,
  sku_id INTEGER REFERENCES inventory_items(id) NOT NULL,
  version_id INTEGER REFERENCES quotation_versions(id),
  communication_id INTEGER REFERENCES negotiation_communications(id),
  change_type VARCHAR(20) NOT NULL,
  old_quantity INTEGER,
  new_quantity INTEGER,
  old_unit_price DECIMAL(10,2),
  new_unit_price DECIMAL(10,2),
  change_reason TEXT,
  changed_by VARCHAR(20) DEFAULT 'CUSTOMER',
  entered_by_user_id INTEGER REFERENCES users(id) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
