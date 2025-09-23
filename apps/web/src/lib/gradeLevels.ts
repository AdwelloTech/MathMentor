// apps/web/src/lib/gradeLevels.ts
import axios from "axios";
import React from "react";
import type { GradeLevel } from "@/types/auth";
import { getPublicEnv } from "./env";

// ---- Config ----
const BASE = getPublicEnv("API_BASE_URL", "http://localhost:8000");
const ENDPOINT = `${BASE}/api/grade_levels`;

// ---- Cache ----
let gradeLevelsCache: GradeLevel[] | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 min

type AnyObj = Record<string, any>;
function normalizeGradeLevel(doc: AnyObj): GradeLevel {
  return {
    id: doc.id ?? doc._id ?? "",
    code: doc.code ?? "",
    display_name: doc.display_name ?? doc.name ?? doc.title ?? "",
    category: doc.category ?? "default",
    sort_order: doc.sort_order ?? doc.order ?? 0,
    is_active: typeof doc.is_active === "boolean" ? doc.is_active : true,
  } as GradeLevel;
}

// ---- API ----
export const fetchGradeLevels = async (): Promise<GradeLevel[]> => {
  const now = Date.now();
  if (gradeLevelsCache && now - lastFetchTime < CACHE_DURATION) return gradeLevelsCache;

  try {
    const params = {
      q: JSON.stringify({ is_active: true }),
      sort: JSON.stringify({ sort_order: 1, order: 1, display_name: 1, name: 1 }),
      limit: 200,
    };

    const { data } = await axios.get(ENDPOINT, { params });
    const items: AnyObj[] = Array.isArray(data?.items) ? data.items : (Array.isArray(data) ? data : []);
    let list = items.map(normalizeGradeLevel);

    if (list.length === 0) {
      const { data: all } = await axios.get(ENDPOINT, {
        params: { ...params, q: JSON.stringify({}) },
      });
      const allItems: AnyObj[] = Array.isArray(all?.items) ? all.items : (Array.isArray(all) ? all : []);
      list = allItems.map(normalizeGradeLevel);
    }

    gradeLevelsCache = list;
    lastFetchTime = now;
    return list;
  } catch (err) {
    console.error("[gradeLevels] fetch failed:", err);
    return [];
  }
};

export const getGradeLevelsByCategory = async (): Promise<Record<string, GradeLevel[]>> => {
  const gradeLevels = await fetchGradeLevels();
  return gradeLevels.reduce((acc, gl) => {
    const cat = gl.category || "default";
    (acc[cat] ||= []).push(gl);
    return acc;
  }, {} as Record<string, GradeLevel[]>);
};

export const findGradeLevelById = async (id: string) => {
  const gradeLevels = await fetchGradeLevels();
  return gradeLevels.find((gl) => gl.id === id) || null;
};

export const findGradeLevelByCode = async (code: string) => {
  const gradeLevels = await fetchGradeLevels();
  return gradeLevels.find((gl) => gl.code === code) || null;
};

export const clearGradeLevelsCache = () => {
  gradeLevelsCache = null;
  lastFetchTime = 0;
};

export const getGradeLevelDisplayName = (id?: string | null): string => {
  if (!id) return "Not specified";
  if (gradeLevelsCache) {
    return gradeLevelsCache.find((gl) => gl.id === id)?.display_name || "Unknown grade";
  }
  return "Loading…";
};

export const useGradeLevels = () => {
  const [gradeLevels, setGradeLevels] = React.useState<GradeLevel[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setGradeLevels(await fetchGradeLevels());
    } catch (e: any) {
      setError(e?.message || "Failed to load grade levels");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => void load(), [load]);

  const refetch = React.useCallback(() => {
    clearGradeLevelsCache();
    return load();
  }, [load]);

  return { gradeLevels, loading, error, refetch };
};