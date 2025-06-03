-- Part 6: Indexes and Final Setup

-- Create Performance Indexes
CREATE INDEX IF NOT EXISTS idx_rfqs_customer_id ON rfqs(customer_id);
CREATE INDEX IF NOT EXISTS idx_rfqs_status ON rfqs(status);
CREATE INDEX IF NOT EXISTS idx_rfqs_created_at ON rfqs(created_at);
CREATE INDEX IF NOT EXISTS idx_rfq_items_rfq_id ON rfq_items(rfq_id);
CREATE INDEX IF NOT EXISTS idx_rfq_items_internal_product_id ON rfq_items(internal_product_id);
CREATE INDEX IF NOT EXISTS idx_quotations_rfq_id ON quotations(rfq_id);
CREATE INDEX IF NOT EXISTS idx_quotations_customer_id ON quotations(customer_id);
CREATE INDEX IF NOT EXISTS idx_quotation_items_quotation_id ON quotation_items(quotation_id);
CREATE INDEX IF NOT EXISTS idx_sales_history_customer_id ON sales_history(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_history_product_id ON sales_history(product_id);
CREATE INDEX IF NOT EXISTS idx_sales_history_sale_date ON sales_history(sale_date);

-- Negotiation System Indexes
CREATE INDEX IF NOT EXISTS idx_negotiation_communications_rfq_id ON negotiation_communications(rfq_id);
CREATE INDEX IF NOT EXISTS idx_negotiation_communications_date ON negotiation_communications(communication_date);
CREATE INDEX IF NOT EXISTS idx_negotiation_communications_follow_up ON negotiation_communications(follow_up_required, follow_up_completed);
CREATE INDEX IF NOT EXISTS idx_sku_negotiation_history_rfq_id ON sku_negotiation_history(rfq_id);
CREATE INDEX IF NOT EXISTS idx_sku_negotiation_history_sku_id ON sku_negotiation_history(sku_id);
CREATE INDEX IF NOT EXISTS idx_sku_negotiation_history_created_at ON sku_negotiation_history(created_at);

-- Add foreign key constraint for current_version_id after quotation_versions table exists
ALTER TABLE rfqs ADD CONSTRAINT fk_rfqs_current_version 
  FOREIGN KEY (current_version_id) REFERENCES quotation_versions(id);

-- Display success message
DO $$
BEGIN
  RAISE NOTICE '🎉 Database setup completed successfully!';
  RAISE NOTICE '✅ All tables created with proper relationships';
  RAISE NOTICE '✅ Indexes created for optimal performance';
  RAISE NOTICE '✅ Negotiation system tables ready';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Next steps:';
  RAISE NOTICE '1. Run the seed script: npm run db:seed';
  RAISE NOTICE '2. Start the development server: npm run dev';
  RAISE NOTICE '3. Navigate to http://localhost:3000';
END $$;
