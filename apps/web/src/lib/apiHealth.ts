
import axios from "axios";
import { supabase } from "./supabase";

export async function ensureApiReachable(): Promise<{ ok: boolean; base: string }> {
  const candidate = (supabase as any)?._api?.defaults?.baseURL || "";
  const bases = candidate.includes(":8080")
    ? [candidate, candidate.replace(":8080", ":8000")]
    : candidate.includes(":8000")
    ? [candidate, candidate.replace(":8000", ":8080")]
    : [candidate];

  for (const base of bases) {
    try {
      const res = await axios.get(base.replace(/\/$/, "") + "/health", { timeout: 800 });
      if (res.status === 200) return { ok: true, base };
    } catch {}
  }
  return { ok: false, base: candidate };
}
