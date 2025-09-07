
import axios from "axios";

function getBaseUrl() {
  const url =
    (typeof import.meta !== "undefined" && (import.meta as any)?.env?.VITE_API_URL) ||
    (typeof process !== "undefined"
      ? (process as any)?.env?.VITE_API_URL || (process as any)?.env?.NEXT_PUBLIC_API_URL
      : "") ||
    "http://localhost:8000";
  return (url || "http://localhost:8000").replace(/\/$/, "");
}

const api = axios.create({
  baseURL: getBaseUrl(),
  headers: { "Content-Type": "application/json" },
});

export async function fetchActiveSubjects() {
  const res = await api.get("/api/subjects", {
    params: { q: JSON.stringify({ is_active: true }), sort: JSON.stringify({ name: 1 }), limit: 200 },
  });
  return res.data?.data ?? [];
}

export async function fetchGradeLevels() {
  const res = await api.get("/api/grade_levels", {
    params: { q: JSON.stringify({ is_active: true }), sort: JSON.stringify({ code: 1 }), limit: 200 },
  });
  return res.data?.data ?? [];
}
