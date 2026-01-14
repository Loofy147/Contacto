// lib/validations/schemas.ts
/**
 * Centralized validation schemas using Zod
 * RED TEAM: Test injection attacks, boundary values, malformed data
 */

import { z } from 'zod';

/**
 * Common validation patterns
 */
const PATTERNS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^\+?[1-9]\d{1,14}$/,
  url: /^https?:\/\/.+/,
  alphanumeric: /^[a-zA-Z0-9]+$/,
  // Algerian phone: +213 followed by 9 digits
  algerianPhone: /^\+213[5-7]\d{8}$/,
};

/**
 * Custom error messages
 */
const MESSAGES = {
  required: 'This field is required',
  invalidEmail: 'Please enter a valid email address',
  invalidPhone: 'Please enter a valid phone number',
  invalidUrl: 'Please enter a valid URL',
  passwordTooShort: 'Password must be at least 8 characters',
  passwordWeak: 'Password must contain uppercase, lowercase, number, and special character',
  nameInvalid: 'Name must contain only letters and spaces',
  postalCodeInvalid: 'Invalid postal code format',
};

/**
 * Reusable field schemas
 */
export const fieldSchemas = {
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, MESSAGES.required)
    .email(MESSAGES.invalidEmail)
    .max(255, 'Email is too long'),

  password: z
    .string()
    .min(8, MESSAGES.passwordTooShort)
    .max(128, 'Password is too long')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      MESSAGES.passwordWeak
    ),

  phone: z
    .string()
    .trim()
    .regex(PATTERNS.phone, MESSAGES.invalidPhone)
    .optional()
    .or(z.literal('')),

  algerianPhone: z
    .string()
    .trim()
    .regex(PATTERNS.algerianPhone, 'Please enter a valid Algerian phone number')
    .optional()
    .or(z.literal('')),

  url: z
    .string()
    .trim()
    .url(MESSAGES.invalidUrl)
    .optional()
    .or(z.literal('')),

  name: z
    .string()
    .trim()
    .min(1, MESSAGES.required)
    .max(100, 'Name is too long')
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, MESSAGES.nameInvalid),

  businessName: z
    .string()
    .trim()
    .min(2, 'Business name must be at least 2 characters')
    .max(255, 'Business name is too long'),

  description: z
    .string()
    .trim()
    .max(2000, 'Description is too long')
    .optional()
    .or(z.literal('')),

  amount: z
    .number()
    .positive('Amount must be positive')
    .max(999999999.99, 'Amount is too large')
    .multipleOf(0.01, 'Invalid amount precision'),

  percentage: z
    .number()
    .min(0, 'Percentage cannot be negative')
    .max(100, 'Percentage cannot exceed 100'),

  quantity: z
    .number()
    .int('Quantity must be a whole number')
    .positive('Quantity must be positive')
    .max(999999, 'Quantity is too large'),

  sku: z
    .string()
    .trim()
    .min(1, MESSAGES.required)
    .max(50, 'SKU is too long')
    .regex(PATTERNS.alphanumeric, 'SKU must be alphanumeric'),
};

/**
 * Authentication schemas
 */
export const authSchemas = {
  login: z.object({
    email: fieldSchemas.email,
    password: z.string().min(1, MESSAGES.required),
    rememberMe: z.boolean().optional(),
  }),

  register: z
    .object({
      email: fieldSchemas.email,
      password: fieldSchemas.password,
      confirmPassword: z.string(),
      firstName: fieldSchemas.name,
      lastName: fieldSchemas.name,
      businessName: fieldSchemas.businessName.optional(),
      acceptTerms: z.boolean().refine((val) => val === true, {
        message: 'You must accept the terms and conditions',
      }),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: 'Passwords do not match',
      path: ['confirmPassword'],
    }),

  passwordReset: z.object({
    email: fieldSchemas.email,
  }),

  passwordResetConfirm: z
    .object({
      password: fieldSchemas.password,
      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: 'Passwords do not match',
      path: ['confirmPassword'],
    }),

  changePassword: z
    .object({
      currentPassword: z.string().min(1, MESSAGES.required),
      newPassword: fieldSchemas.password,
      confirmPassword: z.string(),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: 'Passwords do not match',
      path: ['confirmPassword'],
    })
    .refine((data) => data.currentPassword !== data.newPassword, {
      message: 'New password must be different from current password',
      path: ['newPassword'],
    }),
};

/**
 * Product schemas
 */
export const productSchemas = {
  create: z.object({
    name: z.string().trim().min(1, MESSAGES.required).max(255),
    sku: fieldSchemas.sku,
    description: fieldSchemas.description,
    price: fieldSchemas.amount,
    cost: fieldSchemas.amount.optional(),
    taxRate: fieldSchemas.percentage.optional(),
    categoryId: z.string().uuid('Invalid category'),
    stock: fieldSchemas.quantity.optional(),
    lowStockThreshold: fieldSchemas.quantity.optional(),
    isActive: z.boolean().default(true),
    images: z.array(z.string().url()).max(10, 'Maximum 10 images allowed').optional(),
  }),

  update: z.object({
    name: z.string().trim().min(1, MESSAGES.required).max(255).optional(),
    sku: fieldSchemas.sku.optional(),
    description: fieldSchemas.description.optional(),
    price: fieldSchemas.amount.optional(),
    cost: fieldSchemas.amount.optional(),
    taxRate: fieldSchemas.percentage.optional(),
    categoryId: z.string().uuid('Invalid category').optional(),
    stock: fieldSchemas.quantity.optional(),
    lowStockThreshold: fieldSchemas.quantity.optional(),
    isActive: z.boolean().optional(),
  }),
};

/**
 * Transaction schemas
 */
export const transactionSchemas = {
  create: z.object({
    items: z
      .array(
        z.object({
          productId: z.string().uuid('Invalid product'),
          quantity: fieldSchemas.quantity,
          price: fieldSchemas.amount,
          discount: fieldSchemas.percentage.optional().default(0),
        })
      )
      .min(1, 'At least one item is required'),
    customerId: z.string().uuid('Invalid customer').optional(),
    paymentMethod: z.enum(['cash', 'card', 'mobile', 'bank_transfer']),
    notes: fieldSchemas.description.optional(),
    discount: fieldSchemas.percentage.optional().default(0),
  }),
};

/**
 * Customer schemas
 */
export const customerSchemas = {
  create: z.object({
    firstName: fieldSchemas.name,
    lastName: fieldSchemas.name,
    email: fieldSchemas.email.optional().or(z.literal('')),
    phone: fieldSchemas.algerianPhone.optional().or(z.literal('')),
    address: z.string().trim().max(500).optional().or(z.literal('')),
    city: z.string().trim().max(100).optional().or(z.literal('')),
    postalCode: z.string().trim().max(20).optional().or(z.literal('')),
    notes: fieldSchemas.description.optional(),
  }),
};

/**
 * Helper function to safely parse and validate data
 * RED TEAM: Test with null, undefined, malformed objects
 */
export function validateData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: z.ZodError } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  return { success: false, errors: result.error };
}

/**
 * Format validation errors for display
 */
export function formatValidationErrors(error: z.ZodError): Record<string, string> {
  const formatted: Record<string, string> = {};

  error.errors.forEach((err) => {
    const path = err.path.join('.');
    formatted[path] = err.message;
  });

  return formatted;
}