/** Common Axios API helper for Admin services (MongoDB-backed API) */
import axios, { AxiosInstance } from "axios";

export function getApi(): AxiosInstance {
  const url =
    (typeof import.meta !== "undefined" && (import.meta as any)?.env?.VITE_API_BASE_URL) ||
    (typeof process !== "undefined"
      ? (process as any)?.env?.VITE_API_BASE_URL ||
        (process as any)?.env?.VITE_API_URL ||
        (process as any)?.env?.NEXT_PUBLIC_API_BASE_URL ||
        (process as any)?.env?.NEXT_PUBLIC_API_URL
      : "") ||
    "http://localhost:8000";
  const baseURL = String(url || "http://localhost:8000").replace(/\/$/, "");
  return axios.create({
    baseURL,
    headers: { "Content-Type": "application/json" },
    withCredentials: false,
  });
}

export type ListResp<T> = { items: T[]; total?: number; limit?: number; offset?: number };
export type IdLike = string | number;
export function q(obj: any) { return JSON.stringify(obj ?? {}); }
export function sort(obj: any) { return JSON.stringify(obj ?? {}); }
