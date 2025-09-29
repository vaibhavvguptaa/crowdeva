import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a date to MySQL datetime format (YYYY-MM-DD HH:MM:SS)
 * @param date The date to format (Date object, string, or undefined)
 * @returns Formatted datetime string compatible with MySQL
 */
export function formatMySQLDateTime(date?: Date | string): string {
  if (!date) {
    return new Date().toISOString().slice(0, 19).replace('T', ' ');
  }
  
  if (typeof date === 'string') {
    if (date.includes('T')) {
      // Convert ISO string to MySQL datetime format
      return date.slice(0, 19).replace('T', ' ');
    }
    return date;
  }
  
  if (date instanceof Date) {
    return date.toISOString().slice(0, 19).replace('T', ' ');
  }
  
  return new Date().toISOString().slice(0, 19).replace('T', ' ');
}
