import { getApi } from "./api";
import axios from "axios";

// put at top of each *api.ts (subjects, flashcards, studentTutorMaterials, notes)
function unwrapList(res: any) {
  const j = res?.data;
  if (Array.isArray(j?.items)) return j.items;
  if (Array.isArray(j?.data))  return j.data;
  if (Array.isArray(j))        return j;
  return [];
}


function getBaseUrl() {
  const url =
    (typeof import.meta !== "undefined" &&
      (import.meta as any)?.env?.VITE_API_URL) ||
    (typeof process !== "undefined"
      ? (process as any)?.env?.VITE_API_URL ||
        (process as any)?.env?.NEXT_PUBLIC_API_URL
      : "") ||
    "http://localhost:8000";
  return (url || "http://localhost:8000").replace(/\/$/, "");
}

const api = axios.create({
  baseURL: getBaseUrl(),
  headers: { "Content-Type": "application/json" },
});

export async function listNoteSubjects() {
  const res = await getApi().get("/api/note_subjects", {
    params: { q: { is_active: true }, sort: { sort_order: 1 }, limit: 500 }
  });
  return unwrapList(res);
}

export async function listTutorMaterials(params: any = {}) {
  const res = await getApi().get("/api/tutor_materials", {
    params: {
      q:    { is_active: true, ...params.q },
      sort: { createdAt: -1, ...(params.sort || {}) },
      limit: params.limit ?? 100,
      offset: params.offset ?? 0
    }
  });
  return unwrapList(res);
}



export async function incrementMaterialDownload(materialId: string) {
  await api.post(
    `/api/tutor_materials/${encodeURIComponent(materialId)}/downloads`
  );
}
