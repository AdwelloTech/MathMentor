import { getApi } from "./api";
import axios from "axios";

function getBaseUrl() {
  const url =
    (typeof import.meta !== "undefined" &&
      (import.meta as any)?.env?.VITE_API_URL) ||
    (typeof process !== "undefined"
      ? (process as any)?.env?.VITE_API_URL ||
        (process as any)?.env?.NEXT_PUBLIC_API_URL
      : "") ||
    "http://localhost:8080";
  return (url || "http://localhost:8080").replace(/\/$/, "");
}

const api = axios.create({
  baseURL: getBaseUrl(),
  headers: { "Content-Type": "application/json" },
});

export async function listTutorMaterials(filter: any = {}, limit = 100) {
  const res = await api.get("/api/tutor_materials", {
    params: {
      q: JSON.stringify(filter),
      sort: JSON.stringify({ createdAt: -1 }),
      limit,
    },
  });
  return res.data?.data ?? [];
}

export async function incrementMaterialDownload(materialId: string) {
  await api.post(
    `/api/tutor_materials/${encodeURIComponent(materialId)}/downloads`
  );
}
