// Define model interfaces to match the data structures used in the frontend

/**
 * Base entity with common fields
 */
export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * RFQ status options
 */
export type RfqStatus = 
  | 'new' 
  | 'draft' 
  | 'priced' 
  | 'sent' 
  | 'negotiating' 
  | 'accepted' 
  | 'declined' 
  | 'processed';

/**
 * Customer model
 */
export interface Customer extends BaseEntity {
  name: string;
  type: 'Dealer' | 'Wholesaler';
  lastOrder: string;
  totalOrders: number;
  totalSpentCAD: number;
  email?: string;
  phone?: string;
  address?: string;
}

/**
 * Product/Inventory item
 */
export interface InventoryItem extends BaseEntity {
  sku: string;
  description: string;
  stock: number;
  costCAD: number;
  lastSale: string;
  lowStock?: boolean;
  outOfStock?: boolean;
}

/**
 * RFQ Item
 */
export interface RfqItem {
  id: string;
  sku: string;
  originalSku?: string;
  description: string; 
  quantity: number;
  price: number | null; // Price could be null if not yet set
}

/**
 * RFQ model
 */
export interface Rfq extends BaseEntity {
  rfqNumber: string;
  customerId: string;
  date: string;
  source: 'Email' | 'Phone' | 'Website' | 'In Person';
  status: RfqStatus;
  items: RfqItem[];
  notes?: string;
  subtotalCAD: number;
  taxCAD: number;
  totalCAD: number;
  // Integration metadata
  externalId?: string;
  externalSystem?: string;
  lastSyncedAt?: string;
}

/**
 * SKU Mapping model
 */
export interface SkuMapping extends BaseEntity {
  standardSku: string;
  standardDescription: string;
  variations: SkuVariation[];
}

/**
 * SKU Variation model
 */
export interface SkuVariation {
  id: string;
  sku: string;
  source: string;
}