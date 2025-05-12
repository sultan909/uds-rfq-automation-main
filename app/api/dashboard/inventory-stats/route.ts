import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse } from '../../lib/api-response';
import { handleApiError } from '../../lib/error-handler';
import { InventoryService, RfqService } from '../../lib/mock-db/service';

/**
 * GET /api/dashboard/inventory-stats
 * Get inventory statistics
 */
export async function GET(request: NextRequest) {
  try {
    // Get all inventory items
    const allItems = InventoryService.getAll();
    
    // Get all RFQs
    const allRfqs = RfqService.getAll();
    
    // Calculate inventory status metrics
    const inventoryStatus = {
      totalItems: allItems.length,
      inStock: allItems.filter(item => !item.outOfStock && !item.lowStock).length,
      lowStock: allItems.filter(item => item.lowStock).length,
      outOfStock: allItems.filter(item => item.outOfStock).length
    };
    
    // Calculate total inventory value
    const totalInventoryValueCAD = allItems.reduce((sum, item) => sum + (item.stock * item.costCAD), 0);
    
    // Calculate top requested items
    const topRequestedItems = calculateTopRequestedItems(allRfqs, allItems);
    
    // Calculate missed opportunities due to out of stock
    const missedOpportunities = calculateMissedOpportunities(allRfqs, allItems);
    
    // Return statistics
    return NextResponse.json(createSuccessResponse({
      inventoryStatus,
      totalInventoryValueCAD,
      topRequestedItems,
      missedOpportunities,
      timestamp: new Date().toISOString()
    }));
  } catch (error) {
    return handleApiError(error);
  }
}

// Helper function to calculate top requested items
function calculateTopRequestedItems(rfqs: any[], items: any[]) {
  // Create a map to store the count for each SKU
  const skuCounts: Record<string, { count: number, totalQuantity: number }> = {};
  
  // Count occurrences of each SKU in RFQs
  rfqs.forEach(rfq => {
    rfq.items.forEach((item: any) => {
      if (!skuCounts[item.sku]) {
        skuCounts[item.sku] = { count: 0, totalQuantity: 0 };
      }
      skuCounts[item.sku].count += 1;
      skuCounts[item.sku].totalQuantity += item.quantity;
    });
  });
  
  // Convert to array and add item information
  const topItems = Object.entries(skuCounts).map(([sku, { count, totalQuantity }]) => {
    const itemInfo = items.find(item => item.sku === sku);
    return {
      sku,
      description: itemInfo?.description || 'Unknown Item',
      rfqCount: count,
      totalQuantity,
      stock: itemInfo?.stock || 0,
      costCAD: itemInfo?.costCAD || 0
    };
  });
  
  // Sort by rfqCount in descending order
  topItems.sort((a, b) => b.rfqCount - a.rfqCount);
  
  // Return top 10 items
  return topItems.slice(0, 10);
}

// Helper function to calculate missed opportunities
function calculateMissedOpportunities(rfqs: any[], items: any[]) {
  const missedOpportunities = [];
  
  // Find declined RFQs
  const declinedRfqs = rfqs.filter(rfq => rfq.status === 'declined');
  
  // Check if any items in declined RFQs were out of stock
  for (const rfq of declinedRfqs) {
    for (const rfqItem of rfq.items) {
      const inventoryItem = items.find(item => item.sku === rfqItem.sku);
      
      if (inventoryItem && inventoryItem.outOfStock) {
        // Calculate the potential value
        const potentialValueCAD = rfqItem.quantity * (rfqItem.price || inventoryItem.costCAD * 1.3); // Assuming 30% markup
        
        missedOpportunities.push({
            sku: rfqItem.sku,
            description: inventoryItem.description,
            rfqId: rfq.id,
            rfqNumber: rfq.rfqNumber,
            date: rfq.date,
            quantity: rfqItem.quantity,
            potentialValueCAD: potentialValueCAD
          });
        }
      }
    }
    
    return missedOpportunities;
}