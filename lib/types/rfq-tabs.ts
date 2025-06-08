// Shared types for RFQ tab components

export type RfqStatus = 'NEW' | 'DRAFT' | 'PRICED' | 'SENT' | 'NEGOTIATING' | 'ACCEPTED' | 'DECLINED' | 'PROCESSED';

export type TabName = 'all' | 'items' | 'original-request' | 'pricing' | 'inventory' | 'history' | 'market' | 'settings' | 'quotation-history';

// Inventory related interfaces
export interface InventoryData {
  id: number;
  sku: string;
  mpn: string;
  brand: string;
  description: string;
  quantityOnHand: number;
  quantityReserved: number;
  warehouseLocation: string;
  lowStockThreshold: number;
  costCad?: number;
  costUsd?: number;
  marketPrice?: number;
  marketSource?: string;
  marketLastUpdated?: string;
  competitorPrice?: number;
  marketTrend?: string;
}

export interface InventoryResponse {
  id: number;
  sku: string;
  description: string;
  stock: number;
  cost: number;
  costCurrency: string;
  quantityOnHand: number;
  quantityReserved: number;
  warehouseLocation: string;
  lowStockThreshold: number;
  lastSaleDate: string | null;
}

// History related interfaces
export interface HistoryItem {
  sku: string;
  lastTransaction: string;
  customer: string;
  lastPrice: number;
  lastQuantity: number;
  totalQuantity: number;
  avgPrice: number;
  trend: string;
  mainCustomerHistory?: {
    [customerId: string]: {
      lastTransaction: string;
      lastPrice: number;
      lastQuantity: number;
      totalQuantity: number;
      avgPrice: number;
      trend: string;
    }
  }
}
export interface HistoryState {
  history: HistoryItem[];
}

export interface SalesHistoryResponse {
  success: boolean;
  data: {
    history: Array<{
      type: string;
      date: string;
      customerName: string;
      unitPrice: number;
      quantity: number;
      priceTrend?: string;
      sku: string;
    }>;
    customerName?: string;
  };
}

// API Response interface
export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}

// Column definitions
export interface ColumnDefinition {
  id: string;
  label: string;
}

// Base tab props interface
export interface BaseTabProps {
  items: any[];
  visibleColumns: string[];
  onColumnToggle: (columnId: string) => void;
  renderPagination: () => React.ReactNode | null;
  formatCurrency: (amount: number) => string;
  convertCurrency: (amount: number, sourceCurrency?: "CAD" | "USD") => number;
}

// Customer interface
export interface Customer {
  id: number;
  name: string;
  type?: string;
  email?: string;
  phone?: string;
  address?: string;
  contactPerson?: string;
}

// Main Customer interface
export interface MainCustomer {
  id: number;
  name: string;
}
