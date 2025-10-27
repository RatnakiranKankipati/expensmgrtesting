import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format currency amount to display with proper formatting in Indian Rupees
 */
export function formatCurrency(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

/**
 * Format date to readable string
 */
export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric', 
    year: 'numeric',
    ...options,
  }).format(dateObj);
}

/**
 * Format time to readable string
 */
export function formatTime(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(dateObj);
}

/**
 * Get percentage with proper formatting
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Debounce function for search inputs
 */
export function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Generate a random color from a predefined palette
 */
export function getRandomColor(): string {
  const colors = [
    '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444',
    '#06b6d4', '#f97316', '#84cc16', '#ec4899', '#6b7280'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * Validate file type and size for uploads
 */
export function validateFile(file: File, maxSize: number = 10485760): { isValid: boolean; error?: string } {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
  
  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, error: 'Invalid file type. Please upload JPG, PNG, or PDF files only.' };
  }
  
  if (file.size > maxSize) {
    const maxSizeMB = maxSize / (1024 * 1024);
    return { isValid: false, error: `File size too large. Maximum size is ${maxSizeMB}MB.` };
  }
  
  return { isValid: true };
}

/**
 * Calculate days remaining in current month
 */
export function getDaysLeftInMonth(): number {
  const now = new Date();
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return lastDayOfMonth.getDate() - now.getDate();
}

/**
 * Get start and end dates for common date ranges
 */
export function getDateRange(range: string): { startDate?: string; endDate?: string } {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  
  switch (range) {
    case 'last-7-days':
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return { startDate: sevenDaysAgo.toISOString().split('T')[0], endDate: today };
      
    case 'last-30-days':
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return { startDate: thirtyDaysAgo.toISOString().split('T')[0], endDate: today };
      
    case 'this-month':
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return { startDate: startOfMonth.toISOString().split('T')[0], endDate: today };
      
    case 'last-month':
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      return { 
        startDate: startOfLastMonth.toISOString().split('T')[0], 
        endDate: endOfLastMonth.toISOString().split('T')[0] 
      };
      
    default:
      return {};
  }
}

/**
 * Safe number parsing with fallback
 */
export function safeParseFloat(value: string | number, fallback: number = 0): number {
  if (typeof value === 'number') return value;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? fallback : parsed;
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, length: number = 50): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + '...';
}
