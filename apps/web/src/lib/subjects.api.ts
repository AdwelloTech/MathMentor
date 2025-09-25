import { getApi } from "./api";
// src/lib/api.ts
import axios from "axios";

// put at top of each *api.ts (subjects, flashcards, studentTutorMaterials, notes)
function unwrapList(res: any) {
  const j = res?.data;
  if (Array.isArray(j?.items)) return j.items;
  if (Array.isArray(j?.data))  return j.data;
  if (Array.isArray(j))        return j;
  return [];
}


// --- Resolve base URL (Vite, Next.js, or window global) ---
function getBaseUrl(): string {
  const fromVite =
    (typeof import.meta !== "undefined" &&
      (import.meta as any)?.env?.VITE_API_BASE_URL) ||
    (typeof import.meta !== "undefined" &&
      (import.meta as any)?.env?.VITE_API_URL);

  const fromNode =
    (typeof process !== "undefined" &&
      (process as any)?.env?.VITE_API_BASE_URL) ||
    (typeof process !== "undefined" && (process as any)?.env?.VITE_API_URL) ||
    (typeof process !== "undefined" &&
      (process as any)?.env?.NEXT_PUBLIC_API_URL);

  const fromWindow =
    typeof window !== "undefined" ? (window as any).__API_BASE_URL__ : "";

  const url = (fromVite || fromNode || fromWindow || "http://localhost:8080")
    .toString()
    .replace(/\/$/, "");

  return url || "http://localhost:8080";
}

export async function listSubjects() {
  const res = await getApi().get("/api/subjects", {
    params: {
      q:    { is_active: true },
      sort: { display_name: 1, name: 1, sort_order: 1, createdAt: 1 },
      limit: 500
    }
  });
  return unwrapList(res);
}

export const api = axios.create({
  baseURL: getBaseUrl(),
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

// --- Common helpers to unwrap list/single responses ---
export function unwrapItems<T = any>(data: any): T[] {
  if (!data) return [];
  if (Array.isArray(data)) return data as T[];
  if (Array.isArray(data.items)) return data.items as T[];
  if (Array.isArray(data.data)) return data.data as T[]; // some APIs use "data"
  return (data.items || data.data || []) as T[];
}

export function unwrapSingle<T = any>(data: any): T | null {
  if (!data) return null;
  if (!Array.isArray(data)) return (data as T) ?? null;
  return (data[0] as T) ?? null;
}

// Convenience builders for your server's JSON-in-query
export const q = (obj: any) => ({ q: JSON.stringify(obj) });
export const sort = (obj: any) => ({ sort: JSON.stringify(obj) });
