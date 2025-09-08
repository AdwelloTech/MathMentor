// apps/web/src/contexts/TutorialContext.tsx
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";

// --- base url helper (same pattern you use elsewhere)
function getBaseUrl() {
  const url =
    (typeof import.meta !== "undefined" && (import.meta as any)?.env?.VITE_API_URL) ||
    (typeof process !== "undefined"
      ? (process as any)?.env?.VITE_API_URL || (process as any)?.env?.NEXT_PUBLIC_API_URL
      : "") ||
    "http://localhost:8080";
  return (url || "http://localhost:8080").replace(/\/$/, "");
}
const api = axios.create({ baseURL: getBaseUrl(), headers: { "Content-Type": "application/json" } });

// --- tiny API helpers
async function fetchTutorialStatus(userId: string) {
  const r = await api.get("/api/tutorial_status", { params: { user_id: userId } });
  return r.data?.data ?? { started: false, completed: false };
}
async function setTutorial(userId: string, patch: { started?: boolean; completed?: boolean }) {
  await api.post("/api/tutorial_status", { user_id: userId, ...patch });
}

// --- context types
type TutorialCtx = {
  loading: boolean;
  started: boolean;
  completed: boolean;
  refresh: () => Promise<void>;
  markStarted: () => Promise<void>;
  markCompleted: () => Promise<void>;
};

const Ctx = createContext<TutorialCtx | null>(null);

// You likely already have an AuthContext; we just type a minimal selector to avoid coupling.
// Replace this with your real hook if you have it exported.
type MinimalUser = { id: string; email: string };
const AuthUserContext = React.createContext<MinimalUser | null>(null);
export const useAuthUser = () => useContext(AuthUserContext);

// Provider for tutorial state
export const TutorialProvider: React.FC<{ children: React.ReactNode; userId?: string }> = ({ children, userId }) => {
  // Prefer prop userId; otherwise try to read from your auth context if you wire it here later
  const [loading, setLoading] = useState(true);
  const [started, setStarted] = useState(false);
  const [completed, setCompleted] = useState(false);

  const uid = userId ?? ""; // if you want to wire real uid from your AuthContext, do it here

  const refresh = useCallback(async () => {
    if (!uid) {
      setLoading(false);
      setStarted(false);
      setCompleted(false);
      return;
    }
    setLoading(true);
    try {
      const status = await fetchTutorialStatus(uid);
      setStarted(!!status.started);
      setCompleted(!!status.completed);
    } finally {
      setLoading(false);
    }
  }, [uid]);

  const markStarted = useCallback(async () => {
    if (!uid) return;
    await setTutorial(uid, { started: true });
    setStarted(true);
  }, [uid]);

  const markCompleted = useCallback(async () => {
    if (!uid) return;
    await setTutorial(uid, { completed: true });
    setCompleted(true);
  }, [uid]);

  useEffect(() => {
    // load once on mount or when uid changes
    refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({ loading, started, completed, refresh, markStarted, markCompleted }),
    [loading, started, completed, refresh, markStarted, markCompleted]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export function useTutorial() {
  const ctx = useContext(Ctx);
  if (!ctx) {
    throw new Error("useTutorial must be used within <TutorialProvider>");
  }
  return ctx;
}
