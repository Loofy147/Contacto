// lib/constants/index.ts
/**
 * Application-wide constants
 * RED TEAM: Ensure no sensitive data, validate all external values
 */

/**
 * API Configuration
 */
export const API = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
  TIMEOUT: 30000,
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
} as const;

/**
 * Application Routes
 */
export const ROUTES = {
  // Public routes
  HOME: '/',
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',
  VERIFY_EMAIL: '/auth/verify-email',

  // Dashboard routes
  DASHBOARD: '/dashboard',
  DASHBOARD_OVERVIEW: '/dashboard/overview',

  // Sales routes
  SALES: '/dashboard/sales',
  NEW_SALE: '/dashboard/sales/new',
  SALES_HISTORY: '/dashboard/sales/history',
  REFUNDS: '/dashboard/sales/refunds',

  // Inventory routes
  INVENTORY: '/dashboard/inventory',
  PRODUCTS: '/dashboard/inventory/products',
  PRODUCTS_NEW: '/dashboard/inventory/products/new',
  PRODUCTS_EDIT: '/dashboard/inventory/products/[id]/edit',
  CATEGORIES: '/dashboard/inventory/categories',
  STOCK: '/dashboard/inventory/stock',
  SUPPLIERS: '/dashboard/inventory/suppliers',

  // CRM routes
  CRM: '/dashboard/crm',
  CUSTOMERS: '/dashboard/crm/customers',
  CUSTOMERS_NEW: '/dashboard/crm/customers/new',
  CUSTOMERS_PROFILE: '/dashboard/crm/customers/[id]',
  LOYALTY: '/dashboard/crm/loyalty',

  // Reports routes
  REPORTS: '/dashboard/reports',
  SALES_REPORTS: '/dashboard/reports/sales',
  INVENTORY_REPORTS: '/dashboard/reports/inventory',
  CUSTOMER_REPORTS: '/dashboard/reports/customers',
  FINANCIAL_REPORTS: '/dashboard/reports/financial',

  // Team routes
  TEAM: '/dashboard/team',
  EMPLOYEES: '/dashboard/team/employees',
  EMPLOYEES_NEW: '/dashboard/team/employees/new',
  ROLES: '/dashboard/team/roles',
  ACTIVITY_LOG: '/dashboard/team/activity',

  // Settings routes
  SETTINGS: '/dashboard/settings',
  SETTINGS_PROFILE: '/dashboard/settings/profile',
  SETTINGS_BUSINESS: '/dashboard/settings/business',
  SETTINGS_POS: '/dashboard/settings/pos',
  SETTINGS_NOTIFICATIONS: '/dashboard/settings/notifications',
  SETTINGS_INTEGRATIONS: '/dashboard/settings/integrations',
  SETTINGS_BILLING: '/dashboard/settings/billing',
  SETTINGS_SECURITY: '/dashboard/settings/security',

  // Directory (public)
  DIRECTORY: '/directory',
  PROFESSIONAL_PROFILE: '/directory/[id]',
  SEARCH: '/directory/search',
} as const;

/**
 * Local Storage Keys
 */
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  TOKEN_EXPIRY: 'token_expiry',
  USER_PREFERENCES: 'user_preferences',
  CART: 'cart_data',
  THEME: 'theme_preference',
  SIDEBAR_STATE: 'sidebar_state',
} as const;

/**
 * Payment Methods
 */
export const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash', icon: 'Banknote' },
  { value: 'card', label: 'Credit/Debit Card', icon: 'CreditCard' },
  { value: 'mobile', label: 'Mobile Payment', icon: 'Smartphone' },
  { value: 'bank_transfer', label: 'Bank Transfer', icon: 'Building' },
] as const;

/**
 * Transaction Statuses
 */
export const TRANSACTION_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  REFUNDED: 'refunded',
  CANCELLED: 'cancelled',
  FAILED: 'failed',
} as const;

/**
 * User Roles and Permissions
 */
export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  MANAGER: 'manager',
  CASHIER: 'cashier',
  EMPLOYEE: 'employee',
} as const;

export const PERMISSIONS = {
  // Sales permissions
  CREATE_SALE: 'sales.create',
  VIEW_SALES: 'sales.view',
  REFUND_SALE: 'sales.refund',
  DELETE_SALE: 'sales.delete',

  // Inventory permissions
  CREATE_PRODUCT: 'inventory.product.create',
  EDIT_PRODUCT: 'inventory.product.edit',
  DELETE_PRODUCT: 'inventory.product.delete',
  VIEW_PRODUCT: 'inventory.product.view',
  ADJUST_STOCK: 'inventory.stock.adjust',
  VIEW_STOCK: 'inventory.stock.view',

  // Customer permissions
  CREATE_CUSTOMER: 'crm.customer.create',
  EDIT_CUSTOMER: 'crm.customer.edit',
  DELETE_CUSTOMER: 'crm.customer.delete',
  VIEW_CUSTOMER: 'crm.customer.view',

  // Reports permissions
  VIEW_SALES_REPORTS: 'reports.sales.view',
  VIEW_INVENTORY_REPORTS: 'reports.inventory.view',
  VIEW_FINANCIAL_REPORTS: 'reports.financial.view',
  EXPORT_REPORTS: 'reports.export',

  // Team permissions
  CREATE_EMPLOYEE: 'team.employee.create',
  EDIT_EMPLOYEE: 'team.employee.edit',
  DELETE_EMPLOYEE: 'team.employee.delete',
  VIEW_EMPLOYEE: 'team.employee.view',
  MANAGE_ROLES: 'team.roles.manage',
  VIEW_ACTIVITY_LOG: 'team.activity.view',

  // Settings permissions
  EDIT_BUSINESS_SETTINGS: 'settings.business.edit',
  EDIT_POS_SETTINGS: 'settings.pos.edit',
  MANAGE_INTEGRATIONS: 'settings.integrations.manage',
  VIEW_BILLING: 'settings.billing.view',
} as const;

/**
 * Role-Permission Mapping
 */
export const ROLE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: Object.values(PERMISSIONS),
  [ROLES.ADMIN]: Object.values(PERMISSIONS).filter(p => !p.startsWith('settings.billing')),
  [ROLES.MANAGER]: [
    PERMISSIONS.CREATE_SALE,
    PERMISSIONS.VIEW_SALES,
    PERMISSIONS.REFUND_SALE,
    PERMISSIONS.CREATE_PRODUCT,
    PERMISSIONS.EDIT_PRODUCT,
    PERMISSIONS.VIEW_PRODUCT,
    PERMISSIONS.ADJUST_STOCK,
    PERMISSIONS.VIEW_STOCK,
    PERMISSIONS.CREATE_CUSTOMER,
    PERMISSIONS.EDIT_CUSTOMER,
    PERMISSIONS.VIEW_CUSTOMER,
    PERMISSIONS.VIEW_SALES_REPORTS,
    PERMISSIONS.VIEW_INVENTORY_REPORTS,
    PERMISSIONS.VIEW_EMPLOYEE,
  ],
  [ROLES.CASHIER]: [
    PERMISSIONS.CREATE_SALE,
    PERMISSIONS.VIEW_SALES,
    PERMISSIONS.VIEW_PRODUCT,
    PERMISSIONS.VIEW_STOCK,
    PERMISSIONS.CREATE_CUSTOMER,
    PERMISSIONS.VIEW_CUSTOMER,
  ],
  [ROLES.EMPLOYEE]: [
    PERMISSIONS.VIEW_SALES,
    PERMISSIONS.VIEW_PRODUCT,
    PERMISSIONS.VIEW_STOCK,
    PERMISSIONS.VIEW_CUSTOMER,
  ],
} as const;

/**
 * Pagination Defaults
 */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 20,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
  MAX_PAGE_SIZE: 100,
} as const;

/**
 * Date/Time Formats
 */
export const DATE_FORMATS = {
  SHORT: 'DD/MM/YYYY',
  MEDIUM: 'DD MMM YYYY',
  LONG: 'DD MMMM YYYY',
  FULL: 'dddd, DD MMMM YYYY',
  TIME_12H: 'hh:mm A',
  TIME_24H: 'HH:mm',
  DATETIME: 'DD/MM/YYYY HH:mm',
  ISO: 'YYYY-MM-DDTHH:mm:ss.SSSZ',
} as const;

/**
 * Validation Rules
 */
export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 100,
  EMAIL_MAX_LENGTH: 255,
  PHONE_MIN_LENGTH: 10,
  PHONE_MAX_LENGTH: 15,
  DESCRIPTION_MAX_LENGTH: 2000,
  SKU_MAX_LENGTH: 50,
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  MAX_IMAGES_PER_PRODUCT: 10,
  MAX_QUANTITY: 999999,
  MAX_PRICE: 999999999.99,
} as const;

/**
 * Tax Rates (Algeria)
 */
export const TAX_RATES = {
  STANDARD: 19, // 19% TVA
  REDUCED: 9,   // 9% TVA for certain products
  ZERO: 0,      // Exempt products
} as const;

/**
 * Currency
 */
export const CURRENCY = {
  CODE: 'DZD',
  SYMBOL: 'دج',
  NAME: 'Algerian Dinar',
  DECIMAL_PLACES: 2,
} as const;

/**
 * Notification Durations (ms)
 */
export const NOTIFICATION_DURATION = {
  SHORT: 3000,
  MEDIUM: 5000,
  LONG: 8000,
  PERSISTENT: 0, // Don't auto-dismiss
} as const;

/**
 * File Upload Limits
 */
export const FILE_UPLOAD = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: {
    IMAGE: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    DOCUMENT: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    SPREADSHEET: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv'],
  },
} as const;

/**
 * Chart Colors
 */
export const CHART_COLORS = {
  PRIMARY: '#10b981',
  SECONDARY: '#6b7280',
  SUCCESS: '#22c55e',
  WARNING: '#f59e0b',
  ERROR: '#ef4444',
  INFO: '#3b82f6',
  PURPLE: '#8b5cf6',
  PINK: '#ec4899',
  ORANGE: '#f97316',
  TEAL: '#14b8a6',
} as const;

/**
 * Stock Alert Thresholds
 */
export const STOCK_ALERTS = {
  LOW: 10,
  CRITICAL: 5,
  OUT_OF_STOCK: 0,
} as const;

/**
 * Search Debounce Time (ms)
 */
export const SEARCH_DEBOUNCE = 300;

/**
 * Cache Times (ms)
 */
export const CACHE_TIME = {
  SHORT: 1 * 60 * 1000,      // 1 minute
  MEDIUM: 5 * 60 * 1000,     // 5 minutes
  LONG: 30 * 60 * 1000,      // 30 minutes
  VERY_LONG: 60 * 60 * 1000, // 1 hour
} as const;

/**
 * Query Keys for TanStack Query
 */
export const QUERY_KEYS = {
  AUTH_USER: ['auth', 'user'],
  PRODUCTS: ['products'],
  PRODUCT_DETAIL: (id: string) => ['products', id],
  CATEGORIES: ['categories'],
  CUSTOMERS: ['customers'],
  CUSTOMER_DETAIL: (id: string) => ['customers', id],
  TRANSACTIONS: ['transactions'],
  TRANSACTION_DETAIL: (id: string) => ['transactions', id],
  EMPLOYEES: ['employees'],
  REPORTS_SALES: ['reports', 'sales'],
  REPORTS_INVENTORY: ['reports', 'inventory'],
  DASHBOARD_STATS: ['dashboard', 'stats'],
} as const;