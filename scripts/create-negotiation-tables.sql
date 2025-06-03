-- Migration script to create negotiation tables if they don't exist

-- Create negotiation_communications table
CREATE TABLE IF NOT EXISTS negotiation_communications (
  id SERIAL PRIMARY KEY,
  rfq_id INTEGER NOT NULL,
  version_id INTEGER,
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
  entered_by_user_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create sku_negotiation_history table
CREATE TABLE IF NOT EXISTS sku_negotiation_history (
  id SERIAL PRIMARY KEY,
  rfq_id INTEGER NOT NULL,
  sku_id INTEGER NOT NULL,
  version_id INTEGER,
  communication_id INTEGER,
  change_type VARCHAR(20) NOT NULL,
  old_quantity INTEGER,
  new_quantity INTEGER,
  old_unit_price DECIMAL(10,2),
  new_unit_price DECIMAL(10,2),
  change_reason TEXT,
  changed_by VARCHAR(20) DEFAULT 'CUSTOMER',
  entered_by_user_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_negotiation_communications_rfq_id ON negotiation_communications(rfq_id);
CREATE INDEX IF NOT EXISTS idx_negotiation_communications_date ON negotiation_communications(communication_date);
CREATE INDEX IF NOT EXISTS idx_sku_negotiation_history_rfq_id ON sku_negotiation_history(rfq_id);
CREATE INDEX IF NOT EXISTS idx_sku_negotiation_history_sku_id ON sku_negotiation_history(sku_id);
