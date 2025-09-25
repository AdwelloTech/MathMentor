// apps/web/src/lib/materialsService.ts
import axios from "axios";
import { getPublicEnv } from "./env";

const BASE = getPublicEnv("API_BASE_URL", "http://localhost:8080");

function normMaterial(doc: any) {
  return {
    id: doc.id ?? doc._id ?? "",
    tutor_id: doc.tutor_id ?? doc.tutorId,
    title: doc.title ?? "",
    type: doc.type ?? "file",
    url: doc.url ?? "",
    created_at: doc.createdAt ?? doc.created_at,
  };
}

export const materialsService = {
  async byTutor(tutorId: string, limit = 200, offset = 0) {
    const { data } = await axios.get(`${BASE}/api/tutor_materials`, {
      params: { q: JSON.stringify({ tutor_id: tutorId }), sort: JSON.stringify({ created_at: -1 }), limit, offset },
    });
    const items = Array.isArray(data?.items) ? data.items : (Array.isArray(data) ? data : []);
    return items.map(normMaterial);
  },
};

export default materialsService;