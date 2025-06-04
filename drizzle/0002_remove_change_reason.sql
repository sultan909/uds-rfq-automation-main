-- Remove changeReason column from sku_negotiation_history table
-- This allows automatic negotiation tracking without requiring reasons

ALTER TABLE "sku_negotiation_history" DROP COLUMN IF EXISTS "change_reason";
