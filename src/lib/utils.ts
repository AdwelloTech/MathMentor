import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generate a Jitsi Meet URL for a class session
 * @param classId - Unique identifier for the class
 * @returns Jitsi Meet URL for the class
 */
export function generateJitsiMeetingUrl(classId: string): string {
  // Use a consistent format for class meetings
  return `https://meet.jit.si/class-${classId}`;
}

/**
 * Generate a unique room name for Jitsi meeting
 * @param classId - Unique identifier for the class
 * @param date - Optional date for recurring classes
 * @returns Room name for Jitsi
 */
export function generateJitsiRoomName(classId: string, date?: string): string {
  const baseName = `class-${classId}`;
  return date ? `${baseName}-${date}` : baseName;
}

/**
 * Generate a random password for Jitsi meeting
 * @param length - Length of the password (default: 8)
 * @returns Random password string
 */
export function generateJitsiPassword(length: number = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
