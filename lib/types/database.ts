import { BaseEntity, AuditableEntity } from './api';

// Enum types
export type UserRole = 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
export type CustomerType = 'WHOLESALER' | 'DEALER' | 'RETAILER' | 'DIRECT';
export type Currency = 'CAD' | 'USD';
export type Status = 'PENDING' | 'ACTIVE' | 'INACTIVE' | 'COMPLETED' | 'CANCELLED';
export type RfqStatus = 'PENDING' | 'IN_PROGRESS' | 'QUOTED' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
export type QuotationStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';

// User types
export interface User extends BaseEntity {
  email: string;
  name: string;
  password: string;
  role: UserRole;
  department?: string;
}

export interface SafeUser extends Omit<User, 'password'> {}

// Customer types
export interface Customer extends BaseEntity {
  name: string;
  type: CustomerType;
  region?: string;
  email?: string;
  phone?: string;
  address?: string;
  contactPerson?: string;
  quickbooksId?: string;
  isActive: boolean;
  mainCustomer: boolean;
}

export interface CustomerStats {
  totalOrders: number;
  totalSpent: number;
  lastOrderDate?: string;
  activeRfqs: number;
}

export interface CustomerWithStats extends Customer {
  stats: CustomerStats;
}

// Vendor types
export interface Vendor extends BaseEntity {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  contactPerson?: string;
  category?: string;
  isActive: boolean;
  quickbooksId?: string;
}

// Inventory types
export interface InventoryItem extends BaseEntity {
  sku: string;
  description: string;
  category?: string;
  cost: number;
  currency: Currency;
  quantityOnHand: number;
  quantityReserved: number;
  reorderPoint?: number;
  reorderQuantity?: number;
  location?: string;
  isActive: boolean;
}

export interface InventoryMovement extends BaseEntity {
  inventoryItemId: number;
  movementType: 'IN' | 'OUT' | 'ADJUSTMENT';
  quantity: number;
  reason?: string;
  referenceNumber?: string;
  notes?: string;
}

// RFQ types
export interface Rfq extends AuditableEntity {
  rfqNumber: string;
  customerId: number;
  requestorId: number;
  status: RfqStatus;
  requestDate: string;
  requiredDate?: string;
  notes?: string;
  source: string;
  currency: Currency;
  totalBudget?: number;
}

export interface RfqItem extends BaseEntity {
  rfqId: number;
  name: string;
  description?: string;
  quantity: number;
  unit?: string;
  customerSku?: string;
  internalProductId?: number;
  unitPrice?: number;
  currency: Currency;
  status: Status;
}

export interface RfqWithDetails extends Rfq {
  customer: Customer;
  requestor: SafeUser;
  items: RfqItem[];
  itemCount: number;
}

// Quotation types
export interface Quotation extends AuditableEntity {
  quoteNumber: string;
  rfqId: number;
  customerId: number;
  vendorId: number;
  totalAmount: number;
  currency: Currency;
  deliveryTime?: string;
  validUntil?: string;
  termsAndConditions?: string;
  attachments?: string[];
  isSelected: boolean;
  status: QuotationStatus;
  notes?: string;
  expiryDate?: string;
}

export interface QuotationItem extends BaseEntity {
  quotationId: number;
  rfqItemId: number;
  quantity: number;
  unitPrice: number;
  extendedPrice: number;
  currency: Currency;
  notes?: string;
}

export interface QuotationVersion extends AuditableEntity {
  rfqId: number;
  versionNumber: number;
  status: QuotationStatus;
  submittedAt?: string;
  submittedByUserId?: number;
  notes?: string;
}

export interface QuotationVersionItem extends BaseEntity {
  versionId: number;
  skuId: number;
  quantity: number;
  unitPrice: number;
  currency: Currency;
  notes?: string;
}

// Sales History types
export interface SalesHistory extends BaseEntity {
  invoiceNumber: string;
  customerId: number;
  productId: number;
  quantity: number;
  unitPrice: number;
  extendedPrice: number;
  currency: Currency;
  saleDate: string;
  quickbooksInvoiceId?: string;
}

// Purchase Order types
export interface PurchaseOrder extends BaseEntity {
  poNumber: string;
  vendorId: number;
  status: Status;
  orderDate: string;
  expectedArrivalDate?: string;
  totalAmount: number;
  currency: Currency;
  quickbooksPoId?: string;
}

export interface PoItem extends BaseEntity {
  poId: number;
  productId: number;
  quantity: number;
  unitPrice: number;
  extendedPrice: number;
  receivedQuantity: number;
  currency: Currency;
}

// SKU Mapping types
export interface SkuMapping extends BaseEntity {
  customerSku: string;
  internalSku: string;
  customerId: number;
  confidence: number;
  isVerified: boolean;
  lastUsed?: string;
}

export interface SkuVariation extends BaseEntity {
  skuMappingId: number;
  customerId: number;
  variation: string;
  confidence: number;
}

// Audit Log types
export interface AuditLog extends BaseEntity {
  userId?: number;
  action: string;
  entityType: string;
  entityId: number;
  details?: Record<string, any>;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
}

// Communication types
export interface NegotiationCommunication extends AuditableEntity {
  rfqId: number;
  versionId?: number;
  communicationType: 'EMAIL' | 'PHONE_CALL' | 'MEETING' | 'INTERNAL_NOTE';
  direction: 'OUTBOUND' | 'INBOUND';
  subject?: string;
  content: string;
  followUpRequired: boolean;
  followUpDate?: string;
  followUpCompleted: boolean;
  attachments?: string[];
}

export interface CustomerResponse extends BaseEntity {
  versionId: number;
  status: string;
  comments?: string;
  requestedChanges?: string;
  respondedAt: string;
}

// Settings types
export interface Setting extends BaseEntity {
  key: string;
  value: string;
  description?: string;
  updatedBy?: number;
}

export interface EmailSettings extends BaseEntity {
  enabled: boolean;
  checkInterval: number;
  skuDetectionEnabled: boolean;
  skuAutoMap: boolean;
  skuConfidenceThreshold: number;
  customerDetectionEnabled: boolean;
  customerAutoAssign: boolean;
  customerConfidenceThreshold: number;
}

// Report types
export interface Report extends AuditableEntity {
  name: string;
  type: string;
  parameters: Record<string, any>;
  status: 'GENERATING' | 'COMPLETED' | 'FAILED';
  filePath?: string;
  downloadUrl?: string;
}

// Dashboard types
export interface DashboardMetrics {
  totalRfqs: number;
  pendingRfqs: number;
  completedRfqs: number;
  totalCustomers: number;
  activeCustomers: number;
  totalRevenue: number;
  monthlyRevenue: number;
  averageOrderValue: number;
  topProducts: Array<{
    id: number;
    sku: string;
    description: string;
    quantity: number;
    revenue: number;
  }>;
  topCustomers: Array<{
    id: number;
    name: string;
    orderCount: number;
    totalSpent: number;
  }>;
  recentActivity: Array<{
    id: number;
    type: string;
    description: string;
    timestamp: string;
    userId?: number;
  }>;
}