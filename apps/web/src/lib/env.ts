// apps/web/src/lib/env.ts
// Safe public env accessor for Vite/Next/SSR/browser
export function getPublicEnv(key: string, fallback = ""): string {
  try {
    // Vite
    // @ts-ignore
    if (typeof import.meta !== "undefined" && (import.meta as any).env) {
      const v = (import.meta as any).env?.[`VITE_${key}`];
      if (v !== undefined) return v;
    }
  } catch {}
  try {
    // Next
    if (typeof process !== "undefined" && (process as any).env) {
      const v = (process as any).env[`NEXT_PUBLIC_${key}`];
      if (v !== undefined) return v;
    }
  } catch {}
  try {
    // Window injection
    if (typeof window !== "undefined" && (window as any).__ENV__) {
      const v = (window as any).__ENV__[key];
      if (v !== undefined) return v;
    }
  } catch {}
  return fallback;
}