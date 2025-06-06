-- Verification query to check migration results
-- Run this after the migration to ensure data integrity

-- Migration Summary Report
SELECT 
  'Migration Summary' as report_type,
  COUNT(*) as total_items,
  COUNT(CASE WHEN cost IS NOT NULL THEN 1 END) as items_with_cost,
  COUNT(CASE WHEN cost_currency = 'CAD' THEN 1 END) as cad_items,
  COUNT(CASE WHEN cost_currency = 'USD' THEN 1 END) as usd_items,
  COUNT(CASE WHEN cost_cad IS NOT NULL AND cost != cost_cad THEN 1 END) as cad_mismatch,
  COUNT(CASE WHEN cost_usd IS NOT NULL AND cost != cost_usd THEN 1 END) as usd_mismatch
FROM inventory_items;

-- Show detailed migration results for review (first 20 items)
SELECT 
  id,
  sku,
  cost_cad as old_cad,
  cost_usd as old_usd,
  cost as new_cost,
  cost_currency as new_currency,
  CASE 
    WHEN cost_cad IS NOT NULL AND cost_usd IS NOT NULL THEN 'BOTH_CURRENCIES'
    WHEN cost_cad IS NOT NULL THEN 'CAD_ONLY'
    WHEN cost_usd IS NOT NULL THEN 'USD_ONLY'
    ELSE 'NO_COST'
  END as original_data_status,
  CASE 
    WHEN cost_cad IS NOT NULL AND cost = cost_cad AND cost_currency = 'CAD' THEN '✓ CAD_MIGRATED'
    WHEN cost_usd IS NOT NULL AND cost = cost_usd AND cost_currency = 'USD' THEN '✓ USD_MIGRATED'
    WHEN cost_cad IS NULL AND cost_usd IS NULL AND cost IS NOT NULL THEN '✓ NO_COST_DEFAULT'
    ELSE '❌ MIGRATION_ERROR'
  END as migration_status
FROM inventory_items
ORDER BY id
LIMIT 20;

-- Check for any migration errors
SELECT 
  id,
  sku,
  cost_cad,
  cost_usd,
  cost,
  cost_currency
FROM inventory_items
WHERE 
  -- Cases where migration might have failed
  (cost_cad IS NOT NULL AND (cost != cost_cad OR cost_currency != 'CAD')) OR
  (cost_usd IS NOT NULL AND cost_cad IS NULL AND (cost != cost_usd OR cost_currency != 'USD')) OR
  (cost_cad IS NULL AND cost_usd IS NULL AND cost IS NOT NULL)
ORDER BY id;

-- Show count of items by currency after migration
SELECT 
  cost_currency,
  COUNT(*) as item_count,
  AVG(cost) as avg_cost,
  MIN(cost) as min_cost,
  MAX(cost) as max_cost
FROM inventory_items
WHERE cost IS NOT NULL
GROUP BY cost_currency
ORDER BY cost_currency; 