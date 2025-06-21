// Re-export all types for easier importing
export * from './api';
export * from './database';
export * from './component';

// Legacy compatibility - gradually remove these
export type { ApiResponse, BaseEntity, AuditableEntity } from './api';
export type { 
  User, 
  SafeUser, 
  Customer, 
  CustomerWithStats,
  Rfq, 
  RfqItem, 
  RfqWithDetails,
  InventoryItem,
  Quotation,
  QuotationVersion,
  SalesHistory,
  DashboardMetrics 
} from './database';
export type { 
  TableProps, 
  TableColumn, 
  LoadingState, 
  FormFieldProps,
  AuthContextType,
  CurrencyContextType 
} from './component';