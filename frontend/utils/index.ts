// utils/index.ts
/**
 * General-purpose utility functions
 * RED TEAM: Test with edge cases, null/undefined, malicious inputs
 */

/**
 * Safely parse JSON with fallback
 * RED TEAM: Test with invalid JSON, circular references
 */
export function safeJsonParse<T>(
  json: string,
  fallback: T
): T {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

/**
 * Format currency for Algerian Dinar
 * RED TEAM: Test with negative, zero, very large numbers, NaN
 */
export function formatCurrency(
  amount: number,
  currency: string = 'DZD'
): string {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return '0.00 DZD';
  }

  return new Intl.NumberFormat('fr-DZ', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format date with locale support
 * RED TEAM: Test with invalid dates, timezones, null
 */
export function formatDate(
  date: Date | string | number,
  format: 'short' | 'medium' | 'long' = 'medium'
): string {
  try {
    const d = typeof date === 'string' || typeof date === 'number'
      ? new Date(date)
      : date;

    if (!(d instanceof Date) || isNaN(d.getTime())) {
      return 'Invalid date';
    }

    const options: Intl.DateTimeFormatOptions = {
      short: { month: 'numeric', day: 'numeric', year: '2-digit' },
      medium: { month: 'short', day: 'numeric', year: 'numeric' },
      long: { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' },
    }[format];

    return new Intl.DateTimeFormat('fr-DZ', options).format(d);
  } catch {
    return 'Invalid date';
  }
}

/**
 * Format relative time (e.g., "2 hours ago")
 * RED TEAM: Test with future dates, extreme past, invalid input
 */
export function formatRelativeTime(date: Date | string | number): string {
  try {
    const d = typeof date === 'string' || typeof date === 'number'
      ? new Date(date)
      : date;

    if (!(d instanceof Date) || isNaN(d.getTime())) {
      return 'Invalid date';
    }

    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return 'just now';
    if (diffMin < 60) return `${diffMin} minute${diffMin !== 1 ? 's' : ''} ago`;
    if (diffHour < 24) return `${diffHour} hour${diffHour !== 1 ? 's' : ''} ago`;
    if (diffDay < 30) return `${diffDay} day${diffDay !== 1 ? 's' : ''} ago`;

    return formatDate(d, 'short');
  } catch {
    return 'Invalid date';
  }
}

/**
 * Sanitize string to prevent XSS
 * RED TEAM: Test with script tags, event handlers, encoded attacks
 */
export function sanitizeString(str: string): string {
  if (typeof str !== 'string') return '';

  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };

  return str.replace(/[&<>"'/]/g, (char) => map[char] || char);
}

/**
 * Truncate text with ellipsis
 * RED TEAM: Test with empty strings, null, very long strings
 */
export function truncate(
  text: string,
  maxLength: number,
  suffix: string = '...'
): string {
  if (typeof text !== 'string') return '';
  if (text.length <= maxLength) return text;

  return text.slice(0, maxLength - suffix.length).trim() + suffix;
}

/**
 * Generate unique ID
 * RED TEAM: Test collision probability, performance with many calls
 */
export function generateId(prefix: string = ''): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 9);
  return `${prefix}${prefix ? '_' : ''}${timestamp}_${randomPart}`;
}

/**
 * Deep clone object
 * RED TEAM: Test with circular refs, functions, dates, undefined
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime()) as T;
  }

  if (obj instanceof Array) {
    return obj.map((item) => deepClone(item)) as T;
  }

  if (obj instanceof Object) {
    const cloned = {} as T;
    Object.keys(obj).forEach((key) => {
      (cloned as any)[key] = deepClone((obj as any)[key]);
    });
    return cloned;
  }

  return obj;
}

/**
 * Debounce function
 * RED TEAM: Test with rapid calls, cleanup, context preservation
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function
 * RED TEAM: Test with rapid calls, leading/trailing edge cases
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  let lastResult: ReturnType<T>;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      lastResult = func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
    return lastResult;
  };
}

/**
 * Check if value is empty
 * RED TEAM: Test with 0, false, empty objects/arrays, whitespace
 */
export function isEmpty(value: any): boolean {
  if (value == null) return true;
  if (typeof value === 'boolean') return false;
  if (typeof value === 'number') return false;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (value instanceof Date) return false;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return !value;
}

/**
 * Sleep function for delays
 * RED TEAM: Test with negative values, very large values
 */
export function sleep(ms: number): Promise<void> {
  const delay = Math.max(0, Math.min(ms, 60000)); // Cap at 60 seconds
  return new Promise((resolve) => setTimeout(resolve, delay));
}

/**
 * Capitalize first letter of each word
 * RED TEAM: Test with special chars, numbers, empty strings
 */
export function capitalize(str: string): string {
  if (typeof str !== 'string' || str.length === 0) return '';

  return str
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Calculate percentage
 * RED TEAM: Test with zero divisor, negative numbers, NaN
 */
export function calculatePercentage(
  value: number,
  total: number,
  decimals: number = 2
): number {
  if (typeof value !== 'number' || typeof total !== 'number') return 0;
  if (total === 0) return 0;
  if (isNaN(value) || isNaN(total)) return 0;

  const percentage = (value / total) * 100;
  return Number(percentage.toFixed(decimals));
}

/**
 * Download file from blob
 * RED TEAM: Test with large files, invalid types, filename injection
 */
export function downloadBlob(
  blob: Blob,
  filename: string
): void {
  // Sanitize filename
  const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = safeFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

/**
 * Copy text to clipboard
 * RED TEAM: Test with large text, special characters, permissions
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      return success;
    }
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}

/**
 * Group array by key
 * RED TEAM: Test with missing keys, undefined values, large arrays
 */
export function groupBy<T>(
  array: T[],
  key: keyof T | ((item: T) => string | number)
): Record<string, T[]> {
  if (!Array.isArray(array)) return {};

  return array.reduce((result, item) => {
    const groupKey = typeof key === 'function'
      ? key(item)
      : item[key];
    const keyStr = String(groupKey);

    if (!result[keyStr]) {
      result[keyStr] = [];
    }
    result[keyStr].push(item);

    return result;
  }, {} as Record<string, T[]>);
}

/**
 * Remove duplicates from array
 * RED TEAM: Test with objects, complex types, large arrays
 */
export function unique<T>(
  array: T[],
  key?: keyof T
): T[] {
  if (!Array.isArray(array)) return [];

  if (!key) {
    return [...new Set(array)];
  }

  const seen = new Set();
  return array.filter((item) => {
    const value = item[key];
    if (seen.has(value)) {
      return false;
    }
    seen.add(value);
    return true;
  });
}