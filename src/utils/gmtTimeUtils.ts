/**
 * GMT Time Utilities
 * 
 * All times in the application should be stored and displayed in GMT (Greenwich Mean Time).
 * This ensures consistency across all timezones and prevents confusion.
 */

import { formatTimeInUserTimezone12Hour, formatTimeInUserTimezone24Hour, formatTimeWithRelativeDate as formatTimeWithRelativeDateTZ } from './timezoneUtils';

/**
 * Parse a date and time string as GMT
 * @param dateString - Date in YYYY-MM-DD format
 * @param timeString - Time in HH:MM format (assumed to be GMT)
 * @returns Date object in GMT
 */
export function parseGMTDateTime(dateString: string, timeString: string): Date {
  // Create date string in ISO format with GMT timezone
  const isoString = `${dateString}T${timeString}:00Z`; // Z indicates UTC/GMT
  return new Date(isoString);
}

/**
 * Format a GMT date and time for display
 * @param dateString - Date in YYYY-MM-DD format
 * @param timeString - Time in HH:MM format (GMT)
 * @returns Formatted string with GMT label
 */
export function formatGMTTime(dateString: string, timeString: string): string {
  const date = parseGMTDateTime(dateString, timeString);

  // Format time in 12-hour format with GMT label
  const timeStr = date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'UTC'
  });

  return `${timeStr} GMT`;
}

/**
 * Format GMT date and time with relative date (Today, Tomorrow, etc.)
 * @param dateString - Date in YYYY-MM-DD format
 * @param timeString - Time in HH:MM format (GMT)
 * @returns Formatted string with relative date and GMT label
 */
export function formatGMTTimeWithRelativeDate(dateString: string, timeString: string): string {
  // Convert from GMT to user's local timezone with relative date
  return formatTimeWithRelativeDateTZ(dateString, timeString);
}

/**
 * Format GMT time in 12-hour format with AM/PM
 * @param timeString - Time in HH:MM format (GMT)
 * @returns Formatted time string with user's timezone label
 */
export function formatGMTTime12Hour(timeString: string): string {
  // Convert from GMT to user's local timezone
  return formatTimeInUserTimezone12Hour(timeString);
}

/**
 * Format GMT time in 24-hour format
 * @param timeString - Time in HH:MM format (GMT)
 * @returns Formatted time string with user's timezone label
 */
export function formatGMTTime24Hour(timeString: string): string {
  // Convert from GMT to user's local timezone
  return formatTimeInUserTimezone24Hour(timeString);
}

/**
 * Get current GMT time
 * @returns Current date/time in GMT
 */
export function getCurrentGMT(): Date {
  return new Date();
}

/**
 * Check if a GMT session can be joined (5 minutes before start)
 * @param dateString - Date in YYYY-MM-DD format
 * @param timeString - Time in HH:MM format (GMT)
 * @returns true if session can be joined
 */
export function canJoinGMTSession(dateString: string, timeString: string): boolean {
  const sessionDateTime = parseGMTDateTime(dateString, timeString);
  const now = getCurrentGMT();
  const fiveMinutesBefore = new Date(sessionDateTime.getTime() - 5 * 60 * 1000);

  return now >= fiveMinutesBefore && now <= sessionDateTime;
}

/**
 * Check if a GMT session is currently active
 * @param dateString - Date in YYYY-MM-DD format
 * @param startTime - Start time in HH:MM format (GMT)
 * @param endTime - End time in HH:MM format (GMT)
 * @returns true if session is active
 */
export function isGMTSessionActive(dateString: string, startTime: string, endTime: string): boolean {
  const sessionStart = parseGMTDateTime(dateString, startTime);
  const sessionEnd = parseGMTDateTime(dateString, endTime);
  const now = getCurrentGMT();

  return now >= sessionStart && now <= sessionEnd;
}

/**
 * Check if a GMT session has ended
 * @param dateString - Date in YYYY-MM-DD format
 * @param endTime - End time in HH:MM format (GMT)
 * @returns true if session has ended
 */
export function isGMTSessionEnded(dateString: string, endTime: string): boolean {
  const sessionEnd = parseGMTDateTime(dateString, endTime);
  const now = getCurrentGMT();

  return now > sessionEnd;
}

/**
 * Convert a Date object to GMT time string (HH:MM format)
 * @param date - Date object
 * @returns Time string in HH:MM format (GMT)
 */
export function dateToGMTTimeString(date: Date): string {
  const hours = date.getUTCHours().toString().padStart(2, '0');
  const minutes = date.getUTCMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Convert a Date object to GMT date string (YYYY-MM-DD format)
 * @param date - Date object
 * @returns Date string in YYYY-MM-DD format (GMT)
 */
export function dateToGMTDateString(date: Date): string {
  const year = date.getUTCFullYear();
  const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
  const day = date.getUTCDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}
