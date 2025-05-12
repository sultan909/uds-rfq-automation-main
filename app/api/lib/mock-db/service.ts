import {
  customers,
  inventoryItems,
  rfqs,
  skuMappings,
  marketplaceData as rawMarketplaceData
} from './data';
import {
  Customer,
  InventoryItem,
  Rfq,
  SkuMapping,
  RfqStatus
} from './models';

// Explicitly type marketplaceData for type safety
const marketplaceData: Record<string, Array<{ source: string; priceCAD: number }>> = rawMarketplaceData;

// Helper function to generate a unique ID
function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

// Helper to create a timestamp for now
function getNow(): string {
  return new Date().toISOString();
}

/**
 * Mock database service for Customer data
 */
export const CustomerService = {
  /**
   * Get all customers with optional filtering
   */
  getAll: (filter?: {
    type?: 'Dealer' | 'Wholesaler',
    search?: string
  }): Customer[] => {
    let result = [...customers];
    
    if (filter?.type) {
      result = result.filter(customer => customer.type === filter.type);
    }
    
    if (filter?.search) {
      const searchLower = filter.search.toLowerCase();
      result = result.filter(customer => 
        customer.name.toLowerCase().includes(searchLower)
      );
    }
    
    return result;
  },
  
  /**
   * Get a customer by ID
   */
  getById: (id: string): Customer | undefined => {
    return customers.find(customer => customer.id === id);
  },
  
  /**
   * Create a new customer
   */
  create: (data: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Customer => {
    const newCustomer: Customer = {
      id: generateId(),
      ...data,
      createdAt: getNow(),
      updatedAt: getNow()
    };
    
    customers.push(newCustomer);
    return newCustomer;
  },
  
  /**
   * Update a customer
   */
  update: (id: string, data: Partial<Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>>): Customer | undefined => {
    const index = customers.findIndex(customer => customer.id === id);
    
    if (index === -1) {
      return undefined;
    }
    
    const updatedCustomer = {
      ...customers[index],
      ...data,
      updatedAt: getNow()
    };
    
    customers[index] = updatedCustomer;
    return updatedCustomer;
  }
};

/**
 * Mock database service for Inventory data
 */
export const InventoryService = {
  /**
   * Get all inventory items with optional filtering
   */
  getAll: (filter?: {
    lowStock?: boolean,
    outOfStock?: boolean,
    search?: string
  }): InventoryItem[] => {
    let result = [...inventoryItems];
    
    if (filter?.lowStock) {
      result = result.filter(item => item.lowStock);
    }
    
    if (filter?.outOfStock) {
      result = result.filter(item => item.outOfStock);
    }
    
    if (filter?.search) {
      const searchLower = filter.search.toLowerCase();
      result = result.filter(item => 
        item.sku.toLowerCase().includes(searchLower) ||
        item.description.toLowerCase().includes(searchLower)
      );
    }
    
    return result;
  },
  
  /**
   * Get an inventory item by ID
   */
  getById: (id: string): InventoryItem | undefined => {
    return inventoryItems.find(item => item.id === id);
  },
  
  /**
   * Get an inventory item by SKU
   */
  getBySku: (sku: string): InventoryItem | undefined => {
    return inventoryItems.find(item => item.sku === sku);
  },
  
  /**
   * Create a new inventory item
   */
  create: (data: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>): InventoryItem => {
    const newItem: InventoryItem = {
      id: generateId(),
      ...data,
      createdAt: getNow(),
      updatedAt: getNow()
    };
    
    inventoryItems.push(newItem);
    return newItem;
  },
  
  /**
   * Update an inventory item
   */
  update: (id: string, data: Partial<Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>>): InventoryItem | undefined => {
    const index = inventoryItems.findIndex(item => item.id === id);
    
    if (index === -1) {
      return undefined;
    }
    
    const updatedItem = {
      ...inventoryItems[index],
      ...data,
      updatedAt: getNow()
    };
    
    inventoryItems[index] = updatedItem;
    return updatedItem;
  }
};

/**
 * Mock database service for RFQ data
 */
export const RfqService = {
  /**
   * Get all RFQs with optional filtering
   */
  getAll: (filter?: {
    status?: RfqStatus,
    customerId?: string,
    search?: string,
    dateFrom?: string,
    dateTo?: string
  }): Rfq[] => {
    let result = [...rfqs];
    
    if (filter?.status) {
      result = result.filter(rfq => rfq.status === filter.status);
    }
    
    if (filter?.customerId) {
      result = result.filter(rfq => rfq.customerId === filter.customerId);
    }
    
    if (filter?.search) {
      const searchLower = filter.search.toLowerCase();
      result = result.filter(rfq => 
        rfq.rfqNumber.toLowerCase().includes(searchLower)
      );
    }
    
    if (filter?.dateFrom) {
      const dateFrom = new Date(filter.dateFrom);
      result = result.filter(rfq => new Date(rfq.date) >= dateFrom);
    }
    
    if (filter?.dateTo) {
      const dateTo = new Date(filter.dateTo);
      result = result.filter(rfq => new Date(rfq.date) <= dateTo);
    }
    
    return result;
  },
  
  /**
   * Get an RFQ by ID
   */
  getById: (id: string): Rfq | undefined => {
    return rfqs.find(rfq => rfq.id === id);
  },
  
  /**
   * Get an RFQ by RFQ number
   */
  getByRfqNumber: (rfqNumber: string): Rfq | undefined => {
    return rfqs.find(rfq => rfq.rfqNumber === rfqNumber);
  },
  
  /**
   * Create a new RFQ
   */
  create: (data: Omit<Rfq, 'id' | 'createdAt' | 'updatedAt'>): Rfq => {
    const newRfq: Rfq = {
      id: generateId(),
      ...data,
      createdAt: getNow(),
      updatedAt: getNow()
    };
    
    rfqs.push(newRfq);
    return newRfq;
  },
  
  /**
   * Update an RFQ
   */
  update: (id: string, data: Partial<Omit<Rfq, 'id' | 'createdAt' | 'updatedAt'>>): Rfq | undefined => {
    const index = rfqs.findIndex(rfq => rfq.id === id);
    
    if (index === -1) {
      return undefined;
    }
    
    const updatedRfq = {
      ...rfqs[index],
      ...data,
      updatedAt: getNow()
    };
    
    rfqs[index] = updatedRfq;
    return updatedRfq;
  },
  
  /**
   * Generate a new RFQ number
   */
  generateRfqNumber: (): string => {
    // Find the highest RFQ number, extract the numeric part, and increment it
    const highestNumber = rfqs
      .map(rfq => parseInt(rfq.rfqNumber.replace('RFQ-', ''), 10))
      .reduce((max, current) => Math.max(max, current), 0);
    
    return `RFQ-${(highestNumber + 1).toString().padStart(4, '0')}`;
  }
};

/**
 * Mock database service for SKU mapping data
 */
export const SkuMappingService = {
  /**
   * Get all SKU mappings with optional filtering
   */
  getAll: (filter?: {
    search?: string
  }): SkuMapping[] => {
    let result = [...skuMappings];
    
    if (filter?.search) {
      const searchLower = filter.search.toLowerCase();
      result = result.filter(mapping => 
        mapping.standardSku.toLowerCase().includes(searchLower) ||
        mapping.standardDescription.toLowerCase().includes(searchLower) ||
        mapping.variations.some(variation => 
          variation.sku.toLowerCase().includes(searchLower) ||
          variation.source.toLowerCase().includes(searchLower)
        )
      );
    }
    
    return result;
  },
  
  /**
   * Get a SKU mapping by ID
   */
  getById: (id: string): SkuMapping | undefined => {
    return skuMappings.find(mapping => mapping.id === id);
  },
  
  /**
   * Find the standard SKU for a variation
   */
  findStandardSku: (variationSku: string): { standardSku: string, standardDescription: string } | undefined => {
    const mapping = skuMappings.find(mapping => 
      mapping.variations.some(variation => variation.sku === variationSku)
    );
    
    if (!mapping) {
      return undefined;
    }
    
    return {
      standardSku: mapping.standardSku,
      standardDescription: mapping.standardDescription
    };
  },
  
  /**
   * Create a new SKU mapping
   */
  create: (data: Omit<SkuMapping, 'id' | 'createdAt' | 'updatedAt'>): SkuMapping => {
    const newMapping: SkuMapping = {
      id: generateId(),
      ...data,
      createdAt: getNow(),
      updatedAt: getNow()
    };
    
    skuMappings.push(newMapping);
    return newMapping;
  },
  
  /**
   * Update a SKU mapping
   */
  update: (id: string, data: Partial<Omit<SkuMapping, 'id' | 'createdAt' | 'updatedAt'>>): SkuMapping | undefined => {
    const index = skuMappings.findIndex(mapping => mapping.id === id);
    
    if (index === -1) {
      return undefined;
    }
    
    const updatedMapping = {
      ...skuMappings[index],
      ...data,
      updatedAt: getNow()
    };
    
    skuMappings[index] = updatedMapping;
    return updatedMapping;
  },
  
  /**
   * Delete a SKU mapping
   */
  delete: (id: string): boolean => {
    const index = skuMappings.findIndex(mapping => mapping.id === id);
    
    if (index === -1) {
      return false;
    }
    
    skuMappings.splice(index, 1);
    return true;
  },
  
  /**
   * Detect and suggest mappings for non-standard SKUs
   */
  detectMappings: (skus: string[]): Array<{ 
    original: string, 
    suggested: string, 
    description: string,
    confidence: number 
  }> => {
    const results = [];
    
    for (const sku of skus) {
      // Check for exact matches in variations
      const exactMatch = skuMappings.find(mapping => 
        mapping.variations.some(variation => variation.sku === sku)
      );
      
      if (exactMatch) {
        results.push({
          original: sku,
          suggested: exactMatch.standardSku,
          description: exactMatch.standardDescription,
          confidence: 100
        });
        continue;
      }
      
      // If no exact match, try to find similar SKUs
      // This is a simplified version - in a real system, this would be more sophisticated
      const possibleMatches = [];
      
      for (const mapping of skuMappings) {
        // Check similarity with standard SKU
        const standardSimilarity = calculateSimilarity(sku, mapping.standardSku);
        
        if (standardSimilarity > 0.7) {
          possibleMatches.push({
            sku: mapping.standardSku,
            description: mapping.standardDescription,
            confidence: Math.round(standardSimilarity * 100)
          });
          continue;
        }
        
        // Check similarity with variations
        for (const variation of mapping.variations) {
          const variationSimilarity = calculateSimilarity(sku, variation.sku);
          
          if (variationSimilarity > 0.7) {
            possibleMatches.push({
              sku: mapping.standardSku,
              description: mapping.standardDescription,
              confidence: Math.round(variationSimilarity * 100)
            });
            break;
          }
        }
      }
      
      // Get the best match
      if (possibleMatches.length > 0) {
        const bestMatch = possibleMatches.reduce((prev, current) => 
          prev.confidence > current.confidence ? prev : current
        );
        
        results.push({
          original: sku,
          suggested: bestMatch.sku,
          description: bestMatch.description,
          confidence: bestMatch.confidence
        });
      }
    }
    
    return results;
  }
};

/**
 * Mock marketplace service to get pricing data
 */
export const MarketplaceService = {
  /**
   * Get marketplace pricing data for a SKU
   */
  getPricing: (sku: string): Array<{ source: string, priceCAD: number }> | undefined => {
    return marketplaceData[sku];
  },
  
  /**
   * Get marketplace pricing data for multiple SKUs
   */
  getPricingBatch: (skus: string[]): Record<string, Array<{ source: string, priceCAD: number }>> => {
    const result: Record<string, Array<{ source: string, priceCAD: number }>> = {};
    
    for (const sku of skus) {
      if (marketplaceData[sku]) {
        result[sku] = marketplaceData[sku];
      }
    }
    
    return result;
  },
  
  /**
   * Get average price for a SKU across all marketplaces
   */
  getAveragePrice: (sku: string): number | undefined => {
    const prices = marketplaceData[sku];
    
    if (!prices || prices.length === 0) {
      return undefined;
    }
    
    const total = prices.reduce((sum: number, item: { priceCAD: number }) => sum + item.priceCAD, 0);
    return parseFloat((total / prices.length).toFixed(2));
  }
};

/**
 * Helper function to calculate similarity between two strings
 * This is a simplified version for the mock implementation
 */
function calculateSimilarity(a: string, b: string): number {
  const aClean = a.toLowerCase().replace(/[^a-z0-9]/g, '');
  const bClean = b.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  // If the strings are identical after cleaning, return 1.0
  if (aClean === bClean) {
    return 1.0;
  }
  
  // Check if one string contains the other
  if (aClean.includes(bClean) || bClean.includes(aClean)) {
    return 0.9;
  }
  
  // Count matching characters
  const shorter = aClean.length < bClean.length ? aClean : bClean;
  const longer = aClean.length >= bClean.length ? aClean : bClean;
  
  let matches = 0;
  for (let i = 0; i < shorter.length; i++) {
    if (longer.includes(shorter[i])) {
      matches++;
    }
  }
  
  return matches / longer.length;
}

export type { RfqStatus } from './models';