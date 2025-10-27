export const MONTHS = [
  "January",
  "February", 
  "March",
  "April",
  "May", 
  "June",
  "July",
  "August",
  "September", 
  "October",
  "November",
  "December"
];

export const CURRENT_YEAR = new Date().getFullYear();
export const CURRENT_MONTH = new Date().getMonth() + 1;

export const DEFAULT_CATEGORY_COLORS = [
  "#3b82f6", // blue
  "#10b981", // green  
  "#f59e0b", // yellow
  "#8b5cf6", // purple
  "#ef4444", // red
  "#06b6d4", // cyan
  "#f97316", // orange
  "#84cc16", // lime
  "#ec4899", // pink
  "#6b7280", // gray
];

export const EXPENSE_SORT_OPTIONS = [
  { value: 'date', label: 'Date' },
  { value: 'amount', label: 'Amount' },
  { value: 'description', label: 'Description' },
  { value: 'category', label: 'Category' },
] as const;

export const DATE_FILTER_OPTIONS = [
  { value: 'last-7-days', label: 'Last 7 days' },
  { value: 'last-30-days', label: 'Last 30 days' }, 
  { value: 'this-month', label: 'This month' },
  { value: 'last-month', label: 'Last month' },
  { value: 'custom', label: 'Custom range' },
] as const;

export const CHART_COLORS = {
  primary: "hsl(210 100% 44%)",
  secondary: "hsl(183 100% 38%)", 
  accent: "hsl(42.0290 92.8251% 56.2745%)",
  success: "hsl(147.1429 78.5047% 41.9608%)",
  destructive: "hsl(356.3033 90.5579% 54.3137%)",
  muted: "hsl(215.4 16.3% 46.9%)",
};

export const MAX_FILE_SIZE = 10485760; // 10MB
export const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];

export const PAGINATION_LIMITS = [10, 25, 50, 100] as const;
