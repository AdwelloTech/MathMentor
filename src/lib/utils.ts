import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(...inputs));
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
    // SSR-safe base URL
    const base =
      typeof window !== "undefined" && window?.location?.href
        ? window.location.href
        : "https://app.mathmentor.ai/";
    const urlObj = new URL(url, base);

    // Allow http, https, blob, and data protocols
    if (!["http:", "https:", "blob:", "data:"].includes(urlObj.protocol)) {
      return false;
    }

    // For data: restrict to expected MIME types (e.g., PDFs and images)
    if (urlObj.protocol === "data:") {
      // Only allow PDFs and images
      const dataUrlPattern =
        /^data:(application\/pdf|image\/(png|jpg|jpeg|gif|webp|svg\+xml|bmp))(;base64)?,/i;
      if (!dataUrlPattern.test(url)) {
        return false;
      }
    }

    // Optional: enforce allowed hosts for http/https (e.g., your Supabase storage)
    // const allowedHosts = new Set(["your-supabase-project.supabase.co", "app.mathmentor.ai"]);
    // if ((urlObj.protocol === "http:" || urlObj.protocol === "https:") && !allowedHosts.has(urlObj.host)) {
    //   return false;
    // }

    return true;
  } catch {
    // Invalid URL format
    return false;
  }
}
