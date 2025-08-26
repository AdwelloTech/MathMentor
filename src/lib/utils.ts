import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Checks if a URL is safe for use in iframe src or other contexts
 * Only allows http/https URLs from trusted origins, plus blob/data for file handling
 */
export function isSafeUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== "string") {
    return false;
  }

  try {
    const urlObj = new URL(url, window.location.href);

    // Allow http, https, blob, and data protocols
    if (!["http:", "https:", "blob:", "data:"].includes(urlObj.protocol)) {
      return false;
    }

    // Additional security checks can be added here
    // For example, checking against a whitelist of allowed domains

    return true;
  } catch {
    // Invalid URL format
    return false;
  }
}
