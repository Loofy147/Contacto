// lib/types/index.ts
/**
 * Global TypeScript type definitions
 * RED TEAM: Ensure type safety prevents common vulnerabilities
 */

/**
 * API Response Types
 */
export interface APIResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  metadata?: {
    page?: number;
    pageSize?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface APIError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/**
 * Pagination Types
 */
export interface PaginationParams {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

/**
 * User & Authentication Types
 */
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  permissions: Permission[];
  businessId?: string;
  business?: Business;
  avatar?: string;
  phone?: string;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = 'super_admin' | 'admin' | 'manager' | 'cashier' | 'employee';

export type Permission = string; // See PERMISSIONS constant

export interface Business {
  id: string;
  name: string;
  logo?: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  taxId?: string;
  registrationNumber?: string;
  industry?: string;
  website?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Product Types
 */
export interface Product {
  id: string;
  businessId: string;
  name: string;
  sku: string;
  description?: string;
  price: number;
  cost?: number;
  taxRate: number;
  categoryId: string;
  category?: Category;
  stock: number;
  lowStockThreshold: number;
  isActive: boolean;
  images: string[];
  variants?: ProductVariant[];
  barcode?: string;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  businessId: string;
  name: string;
  description?: string;
  parentId?: string;
  parent?: Category;
  children?: Category[];
  icon?: string;
  color?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  attributes: Record<string, string>;
}

/**
 * Transaction Types
 */
export interface Transaction {
  id: string;
  businessId: string;
  transactionNumber: string;
  type: TransactionType;
  status: TransactionStatus;
  customerId?: string;
  customer?: Customer;
  employeeId: string;
  employee?: User;
  items: TransactionItem[];
  subtotal: number;
  discount: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  notes?: string;
  refundedAmount?: number;
  refundedAt?: string;
  refundReason?: string;
  createdAt: string;
  updatedAt: string;
}

export type TransactionType = 'sale' | 'refund' | 'exchange';
export type TransactionStatus = 'pending' | 'completed' | 'refunded' | 'cancelled' | 'failed';
export type PaymentMethod = 'cash' | 'card' | 'mobile' | 'bank_transfer';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface TransactionItem {
  id: string;
  transactionId: string;
  productId: string;
  product?: Product;
  variantId?: string;
  quantity: number;
  price: number;
  discount: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  total: number;
}

/**
 * Customer Types
 */
export interface Customer {
  id: string;
  businessId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  loyaltyPoints: number;
  totalSpent: number;
  totalTransactions: number;
  lastPurchaseAt?: string;
  notes?: string;
  tags?: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerSegment {
  id: string;
  name: string;
  description?: string;
  criteria: {
    field: string;
    operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'between';
    value: any;
  }[];
  customerCount: number;
}

/**
 * Inventory Types
 */
export interface StockMovement {
  id: string;
  productId: string;
  product?: Product;
  type: StockMovementType;
  quantity: number;
  previousStock: number;
  newStock: number;
  reason?: string;
  referenceId?: string; // Transaction ID, PO ID, etc.
  referenceType?: string;
  userId: string;
  user?: User;
  createdAt: string;
}

export type StockMovementType =
  | 'sale'
  | 'refund'
  | 'adjustment_increase'
  | 'adjustment_decrease'
  | 'transfer'
  | 'damaged'
  | 'expired'
  | 'purchase';

export interface Supplier {
  id: string;
  businessId: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  taxId?: string;
  paymentTerms?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Report Types
 */
export interface SalesReport {
  period: {
    from: string;
    to: string;
  };
  totalSales: number;
  totalTransactions: number;
  averageTransactionValue: number;
  totalRefunds: number;
  netSales: number;
  salesByPaymentMethod: {
    method: PaymentMethod;
    amount: number;
    count: number;
  }[];
  salesByDay: {
    date: string;
    sales: number;
    transactions: number;
  }[];
  topProducts: {
    product: Product;
    quantity: number;
    revenue: number;
  }[];
  topCustomers: {
    customer: Customer;
    transactions: number;
    totalSpent: number;
  }[];
}

export interface InventoryReport {
  totalProducts: number;
  totalValue: number;
  lowStockItems: number;
  outOfStockItems: number;
  totalStockMovements: number;
  productsByCategory: {
    category: Category;
    count: number;
    value: number;
  }[];
  stockMovementsByType: {
    type: StockMovementType;
    count: number;
  }[];
  slowMovingProducts: {
    product: Product;
    stock: number;
    daysSinceLastSale: number;
  }[];
}

export interface FinancialReport {
  period: {
    from: string;
    to: string;
  };
  revenue: number;
  costOfGoodsSold: number;
  grossProfit: number;
  grossProfitMargin: number;
  expenses: number;
  netProfit: number;
  netProfitMargin: number;
  taxCollected: number;
}

/**
 * Dashboard Types
 */
export interface DashboardStats {
  todaySales: number;
  todayTransactions: number;
  weekSales: number;
  monthSales: number;
  yearSales: number;
  lowStockAlerts: number;
  outOfStockAlerts: number;
  newCustomers: number;
  totalCustomers: number;
  averageTransactionValue: number;
  topSellingProducts: {
    product: Product;
    quantity: number;
    revenue: number;
  }[];
  recentTransactions: Transaction[];
  salesTrend: {
    date: string;
    sales: number;
  }[];
}

/**
 * Form Types
 */
export interface FormField<T = any> {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'date' | 'select' | 'textarea' | 'checkbox' | 'radio';
  placeholder?: string;
  defaultValue?: T;
  required?: boolean;
  disabled?: boolean;
  options?: { label: string; value: any }[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: RegExp;
    custom?: (value: T) => boolean | string;
  };
}

export interface FormErrors {
  [key: string]: string;
}

/**
 * Notification Types
 */
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  title?: string;
  duration?: number;
  timestamp: number;
  read?: boolean;
  actionUrl?: string;
  actionLabel?: string;
}

/**
 * Filter & Search Types
 */
export interface FilterOption {
  field: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'between' | 'in';
  value: any;
}

export interface SearchParams {
  query?: string;
  filters?: FilterOption[];
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Chart Data Types
 */
export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface TimeSeriesDataPoint {
  timestamp: string | number;
  value: number;
  label?: string;
}

/**
 * Activity Log Types
 */
export interface ActivityLog {
  id: string;
  userId: string;
  user?: User;
  action: string;
  entityType: string;
  entityId: string;
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

/**
 * Utility Types
 */
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type ID = string;
export type Timestamp = string;
export type DateRange = { from: string; to: string };

/**
 * Component Props Types
 */
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface ModalProps extends BaseComponentProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export interface TableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
}

export interface TableColumn<T> {
  key: string;
  label: string;
  render?: (value: any, row: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
}