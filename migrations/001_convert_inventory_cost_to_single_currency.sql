-- Migration: Convert inventory cost from dual columns to single currency pattern
-- Date: 2024-12-19
-- Description: Migrate from costCad/costUsd columns to cost/costCurrency pattern

BEGIN;

-- Step 1: Add new columns
ALTER TABLE inventory_items 
ADD COLUMN cost REAL,
ADD COLUMN cost_currency VARCHAR(3) DEFAULT 'CAD';

-- Step 2: Migrate existing data
-- Priority: CAD > USD > NULL (with CAD as default currency)
UPDATE inventory_items 
SET 
  cost = COALESCE(cost_cad, cost_usd),
  cost_currency = CASE 
    WHEN cost_cad IS NOT NULL THEN 'CAD'
    WHEN cost_usd IS NOT NULL THEN 'USD'
    ELSE 'CAD'
  END
WHERE cost_cad IS NOT NULL OR cost_usd IS NOT NULL;

-- Step 3: Make cost_currency NOT NULL after data migration
ALTER TABLE inventory_items ALTER COLUMN cost_currency SET NOT NULL;

-- Step 4: Add index on cost_currency for better query performance
CREATE INDEX idx_inventory_items_cost_currency ON inventory_items(cost_currency);

-- Step 5: Verify migration results
-- This will show you the migration results before committing
SELECT 
  id,
  sku,
  cost_cad,
  cost_usd,
  cost,
  cost_currency,
  CASE 
    WHEN cost_cad IS NOT NULL AND cost = cost_cad AND cost_currency = 'CAD' THEN 'CAD_MIGRATED'
    WHEN cost_usd IS NOT NULL AND cost = cost_usd AND cost_currency = 'USD' THEN 'USD_MIGRATED'
    WHEN cost_cad IS NULL AND cost_usd IS NULL AND cost_currency = 'CAD' THEN 'NO_COST_DEFAULT'
    ELSE 'MIGRATION_ERROR'
  END as migration_status
FROM inventory_items
ORDER BY id;

-- Step 6: Drop old columns (COMMENTED OUT FOR SAFETY)
-- Only run these after verifying the migration worked correctly
-- ALTER TABLE inventory_items DROP COLUMN cost_cad;
-- ALTER TABLE inventory_items DROP COLUMN cost_usd;

COMMIT; 