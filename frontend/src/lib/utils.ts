import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(
  value: number,
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    ...options,
  }).format(value);
}

export function formatCurrency(
  value: number,
  currency = 'USD',
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  }).format(value);
}

export function formatDate(
  date: Date | string | number,
  options?: Intl.DateTimeFormatOptions
): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  }).format(new Date(date));
}

export function formatDateTime(
  date: Date | string | number,
  options?: Intl.DateTimeFormatOptions
): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options,
  }).format(new Date(date));
}

export function formatRelativeTime(
  date: Date | string | number,
  baseDate = new Date()
): string {
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  const diff = new Date(date).getTime() - baseDate.getTime();
  const diffInSeconds = Math.floor(diff / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (Math.abs(diffInDays) > 0) {
    return rtf.format(diffInDays, 'day');
  }
  if (Math.abs(diffInHours) > 0) {
    return rtf.format(diffInHours, 'hour');
  }
  if (Math.abs(diffInMinutes) > 0) {
    return rtf.format(diffInMinutes, 'minute');
  }
  return rtf.format(diffInSeconds, 'second');
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function parseAptosAddress(address: string): string {
  if (!address) return '';
  if (address.startsWith('0x')) {
    return address;
  }
  return '0x' + address;
}

export function shortenAddress(
  address: string,
  startLength = 6,
  endLength = 4
): string {
  if (!address) return '';
  if (address.length <= startLength + endLength) return address;
  return `${address.substring(0, startLength)}...${address.substring(
    address.length - endLength
  )}`;
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateAptosAddress(address: string): boolean {
  const aptosAddressRegex = /^0x[a-fA-F0-9]{64}$/;
  return aptosAddressRegex.test(address);
}

export function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  waitMs: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), waitMs);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limitMs: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limitMs);
    }
  };
}

export function copyToClipboard(text: string): Promise<boolean> {
  return navigator.clipboard
    .writeText(text)
    .then(() => true)
    .catch(() => false);
}

export function downloadFile(
  data: string | Blob,
  filename: string,
  type = 'text/plain'
): void {
  const blob = typeof data === 'string' ? new Blob([data], { type }) : data;
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function getStatusColor(
  status: string
): 'success' | 'warning' | 'error' | 'info' | 'default' {
  const statusLower = status.toLowerCase();

  if (['active', 'completed', 'verified', 'success', 'confirmed'].includes(statusLower)) {
    return 'success';
  }

  if (['pending', 'in_progress', 'processing', 'warning'].includes(statusLower)) {
    return 'warning';
  }

  if (['failed', 'rejected', 'cancelled', 'error', 'expired'].includes(statusLower)) {
    return 'error';
  }

  if (['info', 'new', 'draft'].includes(statusLower)) {
    return 'info';
  }

  return 'default';
}

export function calculatePercentageChange(
  current: number,
  previous: number
): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

export function formatPercentage(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

export function formatCarbonCredits(amount: number): string {
  if (amount < 1000) {
    return `${formatNumber(amount)} credits`;
  }
  if (amount < 1000000) {
    return `${formatNumber(amount / 1000, { maximumFractionDigits: 1 })}K credits`;
  }
  return `${formatNumber(amount / 1000000, { maximumFractionDigits: 1 })}M credits`;
}

export function formatEmissions(amount: number): string {
  if (amount < 1000) {
    return `${formatNumber(amount)} kg CO₂e`;
  }
  if (amount < 1000000) {
    return `${formatNumber(amount / 1000, { maximumFractionDigits: 1 })} t CO₂e`;
  }
  return `${formatNumber(amount / 1000000, { maximumFractionDigits: 1 })} kt CO₂e`;
}

export function getEnvironmentConfig() {
  return {
    apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
    wsUrl: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001',
    aptosNodeUrl: process.env.NEXT_PUBLIC_APTOS_NODE_URL || 'https://fullnode.devnet.aptoslabs.com/v1',
    aptosNetwork: process.env.NEXT_PUBLIC_APTOS_NETWORK || 'devnet',
    isDevelopment: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production',
  };
}

export function handleApiError(error: any): string {
  if (error?.response?.data?.error?.message) {
    return error.response.data.error.message;
  }
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  if (error?.message) {
    return error.message;
  }
  return 'An unexpected error occurred';
}