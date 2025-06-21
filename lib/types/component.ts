import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { User, Customer, Rfq, RfqItem, InventoryItem, Quotation } from './database';

// Common component props
export interface BaseComponentProps {
  className?: string;
  children?: ReactNode;
}

// Loading states
export interface LoadingState {
  isLoading: boolean;
  error?: string;
  data?: any;
}

// Form types
export interface FormFieldProps {
  name: string;
  label: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  helperText?: string;
  error?: string;
}

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

// Modal types
export interface ModalProps extends BaseComponentProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

// Table types
export interface TableColumn<T = any> {
  key: string;
  header: string;
  accessor?: keyof T | ((row: T) => any);
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, row: T, index: number) => ReactNode;
}

export interface TableProps<T = any> {
  data: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  error?: string;
  pagination?: {
    page: number;
    pageSize: number;
    totalItems: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
  };
  sorting?: {
    field?: string;
    order?: 'asc' | 'desc';
    onSort: (field: string, order: 'asc' | 'desc') => void;
  };
  selection?: {
    selectedIds: (string | number)[];
    onSelectionChange: (ids: (string | number)[]) => void;
  };
  actions?: {
    onEdit?: (row: T) => void;
    onDelete?: (row: T) => void;
    onView?: (row: T) => void;
    custom?: Array<{
      label: string;
      icon?: LucideIcon;
      onClick: (row: T) => void;
      disabled?: (row: T) => boolean;
      variant?: 'default' | 'destructive' | 'outline' | 'secondary';
    }>;
  };
}

// Navigation types
export interface NavItem {
  label: string;
  href: string;
  icon?: LucideIcon;
  badge?: string | number;
  children?: NavItem[];
  permissions?: string[];
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

// Form component types
export interface RfqFormData {
  customerId: number;
  source: string;
  notes?: string;
  currency: 'CAD' | 'USD';
  title?: string;
  dueDate?: string;
  items: RfqItemFormData[];
}

export interface RfqItemFormData {
  sku: string;
  description: string;
  quantity: number;
  unitPrice?: number;
  unit?: string;
}

export interface CustomerFormData {
  name: string;
  email?: string;
  phone?: string;
  type: 'WHOLESALER' | 'DEALER' | 'RETAILER' | 'DIRECT';
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  contactPerson?: string;
  region?: string;
  isActive?: boolean;
}

export interface InventoryFormData {
  sku: string;
  description: string;
  category?: string;
  cost: number;
  currency: 'CAD' | 'USD';
  quantityOnHand?: number;
  quantityReserved?: number;
  reorderPoint?: number;
  reorderQuantity?: number;
  location?: string;
  isActive?: boolean;
}

// Chart and visualization types
export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface TimeSeriesDataPoint {
  date: string;
  value: number;
  label?: string;
}

export interface ChartProps {
  data: ChartDataPoint[] | TimeSeriesDataPoint[];
  title?: string;
  height?: number;
  width?: number;
  showLegend?: boolean;
  colors?: string[];
}

// Tab component types
export interface TabItem {
  id: string;
  label: string;
  content: ReactNode;
  disabled?: boolean;
  badge?: string | number;
  icon?: LucideIcon;
}

export interface TabsProps {
  items: TabItem[];
  defaultTab?: string;
  onChange?: (tabId: string) => void;
  orientation?: 'horizontal' | 'vertical';
}

// Filter and search types
export interface FilterConfig {
  key: string;
  label: string;
  type: 'text' | 'select' | 'date' | 'number' | 'boolean';
  options?: SelectOption[];
  placeholder?: string;
}

export interface ActiveFilter {
  key: string;
  value: any;
  label: string;
}

export interface SearchFiltersProps {
  filters: FilterConfig[];
  activeFilters: ActiveFilter[];
  onFilterChange: (key: string, value: any) => void;
  onFilterRemove: (key: string) => void;
  onFiltersClear: () => void;
}

// Status and badge types
export type StatusVariant = 'default' | 'secondary' | 'destructive' | 'success' | 'warning';

export interface StatusBadgeProps {
  status: string;
  variant?: StatusVariant;
  size?: 'sm' | 'md' | 'lg';
}

// Context types
export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (userData: Partial<User>) => Promise<void>;
}

export interface CurrencyContextType {
  currency: 'CAD' | 'USD';
  setCurrency: (currency: 'CAD' | 'USD') => void;
  convertPrice: (amount: number, fromCurrency?: 'CAD' | 'USD') => number;
  formatPrice: (amount: number, currency?: 'CAD' | 'USD') => string;
  exchangeRate: number;
}

// Error boundary types
export interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: any;
}

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: any) => void;
}