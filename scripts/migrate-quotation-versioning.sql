-- Migration for SKU-Level Quotation + Negotiation History Feature

-- Add new fields to quotation_versions table
ALTER TABLE quotation_versions 
ADD COLUMN IF NOT EXISTS entry_type VARCHAR(20) NOT NULL DEFAULT 'internal_quote';

ALTER TABLE quotation_versions 
ADD COLUMN IF NOT EXISTS notes TEXT;

ALTER TABLE quotation_versions 
ADD COLUMN IF NOT EXISTS submitted_by_user_id INTEGER REFERENCES users(id);

-- Add current_version_id to rfqs table
ALTER TABLE rfqs 
ADD COLUMN IF NOT EXISTS current_version_id INTEGER REFERENCES quotation_versions(id);

-- Create quotation_version_items table for SKU-level version data
CREATE TABLE IF NOT EXISTS quotation_version_items (
  id SERIAL PRIMARY KEY,
  version_id INTEGER NOT NULL REFERENCES quotation_versions(id) ON DELETE CASCADE,
  sku_id INTEGER NOT NULL REFERENCES inventory_items(id),
  quantity INTEGER NOT NULL,
  unit_price NUMERIC NOT NULL,
  total_price NUMERIC NOT NULL,
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_quotation_version_items_version_id ON quotation_version_items(version_id);
CREATE INDEX IF NOT EXISTS idx_quotation_version_items_sku_id ON quotation_version_items(sku_id);
CREATE INDEX IF NOT EXISTS idx_quotation_versions_rfq_id ON quotation_versions(rfq_id);
CREATE INDEX IF NOT EXISTS idx_quotation_versions_entry_type ON quotation_versions(entry_type);
CREATE INDEX IF NOT EXISTS idx_rfqs_current_version_id ON rfqs(current_version_id);

-- Add comments for documentation
COMMENT ON COLUMN quotation_versions.entry_type IS 'Type of entry: internal_quote, customer_feedback, or counter_offer';
COMMENT ON COLUMN quotation_versions.notes IS 'Additional notes for this version';
COMMENT ON COLUMN quotation_versions.submitted_by_user_id IS 'User who submitted this version';
COMMENT ON COLUMN rfqs.current_version_id IS 'Reference to the current active version';
COMMENT ON TABLE quotation_version_items IS 'SKU-level data for each quotation version';
COMMENT ON COLUMN quotation_version_items.comment IS 'Negotiation notes specific to this SKU item';

-- Create a trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_quotation_version_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_quotation_version_items_updated_at
    BEFORE UPDATE ON quotation_version_items
    FOR EACH ROW
    EXECUTE PROCEDURE update_quotation_version_items_updated_at();
